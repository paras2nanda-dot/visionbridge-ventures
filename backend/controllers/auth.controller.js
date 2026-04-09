import { loginUser, resetPassword } from "../services/auth.service.js";

export const login = async (req, res) => {
  // 🛠️ Normalize: Remove spaces and force lowercase
  const username = req.body.username?.trim().toLowerCase();
  const { password } = req.body;

  try {
    const data = await loginUser(username, password);
    res.json(data);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  // 🛠️ Normalize: Remove spaces and force lowercase
  const username = req.body.username?.trim().toLowerCase();
  const { securityAnswer, newPassword } = req.body;
  
  try {
    await resetPassword(username, securityAnswer, newPassword);
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};