import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

export const loginUser = async (username, password) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE LOWER(username) = LOWER($1)`,
    [username]
  );

  if (result.rows.length === 0) throw new Error("Invalid credentials");

  const user = result.rows[0];
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new Error("Invalid credentials");

  const token = jwt.sign(
    { id: user.id, username: user.username, full_name: user.full_name },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  return { token, user: { username: user.username, full_name: user.full_name } };
};

export const resetPassword = async (username, securityAnswer, newPassword) => {
  const result = await pool.query(
    `SELECT id, security_answer_hash FROM users WHERE LOWER(username) = LOWER($1)`,
    [username]
  );

  if (result.rows.length === 0) throw new Error("User not found");

  const user = result.rows[0];
  const isCorrect = await bcrypt.compare(securityAnswer.toLowerCase().trim(), user.security_answer_hash);
  if (!isCorrect) throw new Error("Incorrect security answer");

  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, user.id]);
  return true;
};