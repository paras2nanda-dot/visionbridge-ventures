import { loginUser, resetPassword } from "../services/auth.service.js";
import { pool } from "../config/db.js";
import jwt from "jsonwebtoken";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from "@simplewebauthn/server";

const rpName = 'VisionBridge Ventures';

// 💡 DYNAMIC ENVIRONMENT HANDLER
const getWebAuthnConfig = (req) => {
  const origin = req.headers.origin || 'https://visionbridge-ventures.vercel.app';
  let rpID;
  try {
    rpID = new URL(origin).hostname; 
  } catch (e) {
    rpID = 'visionbridge-ventures.vercel.app';
  }
  return { rpID, origin };
};

// Temporary memory store for cryptographic challenges
const challengeStore = new Map();

// 🛡️ AUTO-HEALING DB FUNCTION
const ensurePasskeyTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_passkeys (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        credential_id TEXT NOT NULL,
        public_key TEXT NOT NULL,
        counter BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.error("Error ensuring passkey table exists:", err.message);
  }
};

// ==========================================
// STANDARD AUTHENTICATION
// ==========================================

export const login = async (req, res) => {
  const username = req.body.username?.trim().toLowerCase();
  const { password } = req.body;

  try {
    const data = await loginUser(username, password);
    
    res.cookie('token', data.token, {
      httpOnly: true,
      secure: true, 
      sameSite: 'None', 
      maxAge: 8 * 60 * 60 * 1000 
    });

    res.json({ message: "Login successful", user: data.user, token: data.token });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  const username = req.body.username?.trim().toLowerCase();
  const { securityAnswer, newPassword } = req.body;
  try {
    await resetPassword(username, securityAnswer, newPassword);
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: "Logged out" });
};


// ==========================================
// 🛡️ BIOMETRIC (PASSKEY) AUTHENTICATION
// ==========================================

export const generateRegOptions = async (req, res) => {
  const username = req.body.username?.trim().toLowerCase();
  const { rpID } = getWebAuthnConfig(req);
  
  if (!username || !['paras', 'himanshu'].includes(username)) {
    return res.status(403).json({ error: "Only authorized administrators can register biometrics." });
  }

  try {
    await ensurePasskeyTable(); 
    const userPasskeys = await pool.query('SELECT credential_id FROM user_passkeys WHERE username = $1', [username]);

    const safeExcludeCredentials = userPasskeys.rows
      .filter(key => key.credential_id)
      .map(key => ({
        id: key.credential_id, 
        type: 'public-key',
      }));

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new Uint8Array(Buffer.from(username)), 
      userName: username,
      userDisplayName: username,
      excludeCredentials: safeExcludeCredentials,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    challengeStore.set(`reg_${username}`, options.challenge);
    res.json(options);
  } catch (err) {
    console.error("Error generating reg options:", err);
    res.status(500).json({ error: `Backend Crash: ${err.message}` });
  }
};

export const verifyReg = async (req, res) => {
  const username = req.body.username?.trim().toLowerCase();
  const body = req.body.data;
  const { rpID, origin } = getWebAuthnConfig(req);
  const expectedChallenge = challengeStore.get(`reg_${username}`);

  if (!expectedChallenge) return res.status(400).json({ error: "Challenge expired. Try again." });

  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credential } = verification.registrationInfo;

      await ensurePasskeyTable();
      await pool.query(
        `INSERT INTO user_passkeys (username, credential_id, public_key, counter) VALUES ($1, $2, $3, $4)`,
        [
          username, 
          credential.id, 
          Buffer.from(credential.publicKey).toString('base64url'), 
          credential.counter
        ]
      );

      // 📝 AUDIT TRAIL LOG (Optional: Connect to your ActivityFeed service)
      console.log(`AUDIT: Passkey registered for user: ${username}`);

      challengeStore.delete(`reg_${username}`);
      return res.json({ verified: true, message: "Device registered successfully!" });
    }
  } catch (error) {
    console.error("WebAuthn Reg Error:", error);
    return res.status(400).json({ error: error.message });
  }
};

export const generateAuthOptions = async (req, res) => {
  const username = req.body.username?.trim().toLowerCase();
  const { rpID } = getWebAuthnConfig(req);

  if (!username) return res.status(400).json({ error: "Username required" });

  try {
    await ensurePasskeyTable();
    const userKeys = await pool.query('SELECT * FROM user_passkeys WHERE username = $1', [username]);
    
    if (userKeys.rows.length === 0) {
        return res.status(404).json({ error: "No biometrics registered. Please login with password to register this device." });
    }

    const safeAllowCredentials = userKeys.rows
      .filter(key => key.credential_id)
      .map(key => ({
        id: key.credential_id, 
        type: 'public-key',
      }));

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: safeAllowCredentials,
      userVerification: 'preferred',
    });

    challengeStore.set(`auth_${username}`, options.challenge);
    res.json(options);
  } catch (err) {
    console.error("Auth Options Error:", err);
    res.status(500).json({ error: `Auth setup failed: ${err.message}` });
  }
};

export const verifyAuth = async (req, res) => {
  const username = req.body.username?.trim().toLowerCase();
  const body = req.body.data; 
  const { rpID, origin } = getWebAuthnConfig(req);
  const expectedChallenge = challengeStore.get(`auth_${username}`);

  if (!expectedChallenge) return res.status(400).json({ error: "Challenge expired. Try again." });

  try {
    const userKeys = await pool.query('SELECT * FROM user_passkeys WHERE username = $1', [username]);
    const passkey = userKeys.rows.find(k => k.credential_id === body.id);

    if (!passkey) {
        return res.status(400).json({ 
            error: "This device is no longer synced. Please login with your password to re-register it." 
        });
    }

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: passkey.credential_id, 
        publicKey: new Uint8Array(Buffer.from(passkey.public_key, 'base64url')), 
        counter: Number(passkey.counter),
      },
    });

    if (verification.verified) {
      await pool.query('UPDATE user_passkeys SET counter = $1 WHERE id = $2', [verification.authenticationInfo.newCounter, passkey.id]);
      challengeStore.delete(`auth_${username}`);

      const token = jwt.sign(
        { username, role: 'admin' }, 
        process.env.JWT_SECRET || 'fallback_secret_key', 
        { expiresIn: '8h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: true, 
        sameSite: 'None', 
        maxAge: 8 * 60 * 60 * 1000 
      });

      return res.json({ message: "Biometric login successful", user: { username }, token });
    }
  } catch (error) {
    console.error("WebAuthn Auth Error:", error);
    return res.status(400).json({ error: error.message });
  }
};

// ==========================================
// ⚙️ PASSKEY MANAGEMENT
// ==========================================

export const getPasskeys = async (req, res) => {
  try {
    const username = req.user.username; 
    await ensurePasskeyTable();
    const result = await pool.query(
      'SELECT id, username, created_at FROM user_passkeys WHERE username = $1 ORDER BY created_at DESC',
      [username]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deletePasskey = async (req, res) => {
  const { id } = req.params;
  const username = req.user.username;
  try {
    const result = await pool.query(
      'DELETE FROM user_passkeys WHERE id = $1 AND username = $2 RETURNING *', 
      [id, username]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Passkey not found or unauthorized." });
    }

    // 📝 AUDIT TRAIL LOG
    console.log(`AUDIT: Passkey revoked for user: ${username}`);

    res.json({ message: "Passkey removed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};