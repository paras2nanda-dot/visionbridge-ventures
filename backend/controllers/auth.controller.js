import { loginUser, resetPassword } from "../services/auth.service.js";
import { pool } from "../config/db.js";
import jwt from "jsonwebtoken";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from "@simplewebauthn/server";

// 🟢 IMPORT SYSTEM LOGGER
import { logActivity } from "./activityController.js";

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

/**
 * 🛡️ HIGH-02 FIX: DATABASE-BACKED CHALLENGE STORE
 * Replaces the in-memory Map to survive server restarts on Render.
 */
const saveChallenge = async (key, challenge) => {
  await pool.query(
    `INSERT INTO webauthn_challenges (key, challenge) VALUES ($1, $2) 
     ON CONFLICT (key) DO UPDATE SET challenge = $2, created_at = NOW()`,
    [key, challenge]
  );
};

const getChallenge = async (key) => {
  // Challenges expire after 5 minutes for security
  const result = await pool.query(
    `SELECT challenge FROM webauthn_challenges 
     WHERE key = $1 AND created_at > NOW() - INTERVAL '5 minutes'`,
    [key]
  );
  return result.rows[0]?.challenge;
};

const deleteChallenge = async (key) => {
  await pool.query('DELETE FROM webauthn_challenges WHERE key = $1', [key]);
};

/**
 * 🛡️ AUTO-HEALING DB FUNCTION
 * Ensures all necessary WebAuthn tables exist.
 */
const ensureWebAuthnTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_passkeys (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        credential_id TEXT NOT NULL,
        public_key TEXT NOT NULL,
        counter BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS webauthn_challenges (
        key TEXT PRIMARY KEY,
        challenge TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
  } catch (err) {
    console.error("Error ensuring WebAuthn tables exist:", err.message);
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
    await ensureWebAuthnTables(); 
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
        residentKey: 'required',
        userVerification: 'preferred',
      },
    });

    await saveChallenge(`reg_${username}`, options.challenge);
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
  
  const expectedChallenge = await getChallenge(`reg_${username}`);

  if (!expectedChallenge) return res.status(400).json({ error: "Challenge expired or not found. Try again." });

  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credential } = verification.registrationInfo;

      await pool.query(
        `INSERT INTO user_passkeys (username, credential_id, public_key, counter) VALUES ($1, $2, $3, $4)`,
        [
          username, 
          credential.id, 
          Buffer.from(credential.publicKey).toString('base64url'), 
          credential.counter
        ]
      );

      await logActivity(username, "CREATE", "Security", "Registered new biometric device");
      await deleteChallenge(`reg_${username}`);
      
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

  try {
    await ensureWebAuthnTables();
    
    let allowCredentials = [];
    if (username) {
      const userKeys = await pool.query('SELECT * FROM user_passkeys WHERE username = $1', [username]);
      allowCredentials = userKeys.rows.map(key => ({
        id: key.credential_id, 
        type: 'public-key',
      }));
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials,
      userVerification: 'preferred',
    });

    const challengeKey = username ? `auth_${username}` : `auth_discoverable`;
    await saveChallenge(challengeKey, options.challenge);
    
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
  
  const challengeKey = username ? `auth_${username}` : `auth_discoverable`;
  const expectedChallenge = await getChallenge(challengeKey);

  if (!expectedChallenge) return res.status(400).json({ error: "Challenge expired. Try again." });

  try {
    const keyResult = await pool.query('SELECT * FROM user_passkeys WHERE credential_id = $1', [body.id]);
    const passkey = keyResult.rows[0];

    if (!passkey) {
        return res.status(400).json({ 
            error: "Device not recognized. Please login with password to re-register." 
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
      await deleteChallenge(challengeKey);

      const authUsername = passkey.username;

      /**
       * 🛡️ MED-07 FIX: FETCH ACTUAL ROLE FROM DB
       * Prevents biometric login from incorrectly granting hardcoded admin rights.
       */
      const userResult = await pool.query('SELECT role FROM users WHERE username = $1', [authUsername]);
      const userRole = userResult.rows[0]?.role || 'advisor';

      const token = jwt.sign(
        { username: authUsername, role: userRole }, 
        process.env.JWT_SECRET || 'fallback_secret_key', 
        { expiresIn: '8h' }
      );

      await logActivity(authUsername, "UPDATE", "Login", "Authenticated via Biometrics");

      res.cookie('token', token, {
        httpOnly: true,
        secure: true, 
        sameSite: 'None', 
        maxAge: 8 * 60 * 60 * 1000 
      });

      return res.json({ message: "Biometric login successful", user: { username: authUsername, role: userRole }, token });
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
    await ensureWebAuthnTables();
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

    await logActivity(username, "DELETE", "Security", "Revoked biometric device");

    res.json({ message: "Passkey removed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};