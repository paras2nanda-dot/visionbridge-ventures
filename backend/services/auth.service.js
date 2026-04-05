import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

/**
 * 🔑 Authenticate User
 */
export const loginUser = async (username, password) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE username = $1`,
    [username]
  );

  if (result.rows.length === 0) {
    throw new Error("Invalid username or password");
  }

  const user = result.rows[0];
  const match = await bcrypt.compare(password, user.password_hash);

  if (!match) {
    throw new Error("Invalid username or password");
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, full_name: user.full_name },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  return { token, user: { username: user.username, full_name: user.full_name } };
};

/**
 * 🔒 Reset Password with Security Challenge
 */
export const resetPassword = async (username, securityAnswer, newPassword) => {
  // 1. Fetch user and their stored security hash
  const result = await pool.query(
    `SELECT id, security_answer_hash FROM users WHERE username = $1`,
    [username]
  );

  if (result.rows.length === 0) {
    throw new Error("User not found");
  }

  const user = result.rows[0];

  // 2. Safety check: Ensure an answer exists in the DB
  if (!user.security_answer_hash) {
    throw new Error("Security answer not set. Contact system admin.");
  }

  // 3. Compare the provided answer with the hashed version in DB
  const cleanAnswer = securityAnswer.toLowerCase().trim();
  const isAnswerCorrect = await bcrypt.compare(cleanAnswer, user.security_answer_hash);

  if (!isAnswerCorrect) {
    // 💡 THE SMART DEBUGGER: 
    // Generates a fresh hash for "delhi" using YOUR machine's local bcrypt salt.
    const machineHash = await bcrypt.hash("delhi", 10);
    
    console.log(`\n❌ SECURITY CHALLENGE FAILED FOR: ${username}`);
    console.log(`👉 Your machine generated a fresh hash for 'delhi': ${machineHash}`);
    console.log(`👉 RUN THIS SQL IN NEON CONSOLE TO SYNC:`);
    console.log(`\nUPDATE users SET security_answer_hash = '${machineHash}' WHERE username = '${username}';\n`);
    
    throw new Error("Incorrect security answer");
  }

  // 4. Update the actual password if challenge is passed
  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  await pool.query(
    `UPDATE users SET password_hash = $1 WHERE username = $2`,
    [newPasswordHash, username]
  );

  console.log(`✅ Password reset successful for user: ${username}`);
  return true;
};