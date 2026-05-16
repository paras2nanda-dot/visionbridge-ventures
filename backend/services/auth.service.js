/* eslint-disable no-unused-vars */
import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * 🔑 Authenticate User (Case-Insensitive)
 * M-2 FIX: Added 'role' to JWT payload for secure route handling.
 * C-2 FIX: Removed weak fallback secret.
 */
export const loginUser = async (username, password) => {
  // We fetch the role from the database to include it in the session
  const result = await pool.query(
    `SELECT id, username, full_name, password_hash, role 
     FROM users 
     WHERE LOWER(username) = LOWER($1)`,
    [username]
  );

  if (result.rows.length === 0) throw new Error("Invalid credentials");

  const user = result.rows[0];
  
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new Error("Invalid credentials");

  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) throw new Error("Server Error: JWT_SECRET not configured");

  // 🛡️ Token payload now includes role for permission-based access
  const token = jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role || 'advisor' 
    },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  return { 
    token, 
    user: { 
      username: user.username, 
      full_name: user.full_name, 
      role: user.role || 'advisor' 
    } 
  };
};

/**
 * 🔒 Reset Password (Security Question)
 */
export const resetPassword = async (username, securityAnswer, newPassword) => {
  const result = await pool.query(
    `SELECT id, security_answer_hash FROM users WHERE LOWER(username) = LOWER($1)`,
    [username]
  );

  if (result.rows.length === 0) throw new Error("User not found");

  const user = result.rows[0];

  if (!user.security_answer_hash) {
    throw new Error("Security answer not set for this account. Contact system admin.");
  }

  const cleanAnswer = securityAnswer.toLowerCase().trim();
  const isAnswerCorrect = await bcrypt.compare(cleanAnswer, user.security_answer_hash);

  if (!isAnswerCorrect) {
    throw new Error("Incorrect security answer");
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  await pool.query(
    `UPDATE users SET password_hash = $1 WHERE id = $2`,
    [newPasswordHash, user.id]
  );

  return true;
};