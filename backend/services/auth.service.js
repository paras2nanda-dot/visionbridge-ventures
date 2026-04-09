import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

/**
 * 🔑 Authenticate User (Case-Insensitive)
 */
export const loginUser = async (username, password) => {
  // 🛠️ LOWER() ensures we match regardless of DB casing
  const result = await pool.query(
    `SELECT * FROM users WHERE LOWER(username) = LOWER($1)`,
    [username]
  );

  if (result.rows.length === 0) throw new Error("Invalid credentials");

  const user = result.rows[0];
  
  // 🛡️ Using bcryptjs to check password
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new Error("Invalid credentials");

  const token = jwt.sign(
    { id: user.id, username: user.username, full_name: user.full_name },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  return { token, user: { username: user.username, full_name: user.full_name } };
};

/**
 * 🔒 Reset Password (Case-Insensitive)
 */
export const resetPassword = async (username, securityAnswer, newPassword) => {
  const result = await pool.query(
    `SELECT id, security_answer_hash FROM users WHERE LOWER(username) = LOWER($1)`,
    [username]
  );

  if (result.rows.length === 0) throw new Error("User not found");

  const user = result.rows[0];

  if (!user.security_answer_hash) {
    throw new Error("Security answer not set. Contact system admin.");
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