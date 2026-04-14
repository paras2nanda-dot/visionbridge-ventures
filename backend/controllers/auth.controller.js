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

// Temporary memory store for cryptographic challenges during the 30-second login window
const challengeStore = new Map();

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

// 1. Ask the device to generate a new Fingerprint/FaceID lock
export const generateRegOptions = async (req, res) => {
  const username = req.body.username?.trim().toLowerCase();
  
  if (!username || !['paras', 'himanshu'].includes(username)) {
    return res.status(403).json({ error: "Only authorized administrators can register biometrics." });
  }

  try {
    // Check if they already have keys registered to avoid duplicates
    const userPasskeys = await pool.query('SELECT credential_id FROM user_passkeys WHERE username = $1', [username]);

    const options = await generateRegistrationOptions({
      rpName,
      rpID: req.hostname,
      userID: Buffer.from(username), // Device requires a byte array
      userName: username,
      excludeCredentials: userPasskeys.rows.map(key => ({
        id: Buffer.from(key.credential_id, 'base64url'),
        type: 'public-key',
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform', // Forces built-in scanners (TouchID, Windows Hello, Android Fingerprint)
      },
    });

    // Save the challenge temporarily
    challengeStore.set(`reg_${username}`, options.challenge);

    res.json(options);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Verify the generated lock and save the Public Key to the database
export const verifyReg = async (req, res) => {
  const username = req.body.username?.trim().toLowerCase();
  const body = req.body.data;
  const expectedChallenge = challengeStore.get(`reg_${username}`);

  if (!expectedChallenge) return res.status(400).json({ error: "Challenge expired. Try again." });

  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: req.headers.origin,
      expectedRPID: req.hostname,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;

      // Save the Public Key & Credential ID to PostgreSQL as base64url strings
      await pool.query(
        `INSERT INTO user_passkeys (username, credential_id, public_key, counter) VALUES ($1, $2, $3, $4)`,
        [
          username, 
          Buffer.from(credentialID).toString('base64url'), 
          Buffer.from(credentialPublicKey).toString('base64url'), 
          counter
        ]
      );

      challengeStore.delete(`reg_${username}`);
      return res.json({ verified: true, message: "Fingerprint registered successfully!" });
    }
  } catch (error) {
    console.error("WebAuthn Reg Error:", error);
    return res.status(400).json({ error: error.message });
  }
};

// 3. Login: Create a crypto puzzle for the device to solve
export const generateAuthOptions = async (req, res) => {
  const username = req.body.username?.trim().toLowerCase();
  if (!username) return res.status(400).json({ error: "Username required" });

  try {
    const userKeys = await pool.query('SELECT * FROM user_passkeys WHERE username = $1', [username]);
    if (userKeys.rows.length === 0) return res.status(404).json({ error: "No biometrics registered for this user." });

    const options = await generateAuthenticationOptions({
      rpID: req.hostname,
      allowCredentials: userKeys.rows.map(key => ({
        id: Buffer.from(key.credential_id, 'base64url'),
        type: 'public-key',
      })),
      userVerification: 'preferred',
    });

    challengeStore.set(`auth_${username}`, options.challenge);
    res.json(options);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Login: Verify the puzzle answer and issue the JWT Login Token
export const verifyAuth = async (req, res) => {
  const username = req.body.username?.trim().toLowerCase();
  const body = req.body.data;
  const expectedChallenge = challengeStore.get(`auth_${username}`);

  if (!expectedChallenge) return res.status(400).json({ error: "Challenge expired. Try again." });

  try {
    const userKeys = await pool.query('SELECT * FROM user_passkeys WHERE username = $1', [username]);
    const passkey = userKeys.rows.find(k => k.credential_id === body.id);

    if (!passkey) return res.status(400).json({ error: "Fingerprint device not recognized." });

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: req.headers.origin,
      expectedRPID: req.hostname,
      authenticator: {
        credentialPublicKey: Buffer.from(passkey.public_key, 'base64url'),
        credentialID: Buffer.from(passkey.credential_id, 'base64url'),
        counter: Number(passkey.counter),
      },
    });

    if (verification.verified) {
      // Prevent replay attacks by incrementing the counter
      await pool.query('UPDATE user_passkeys SET counter = $1 WHERE id = $2', [verification.authenticationInfo.newCounter, passkey.id]);
      challengeStore.delete(`auth_${username}`);

      // Issue Standard JWT Token for seamless login
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