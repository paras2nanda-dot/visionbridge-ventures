import { loginUser, resetPassword } from "../services/auth.service.js";

export const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const data = await loginUser(username, password);
    res.json(data);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  // 💡 THE FIX: We must extract securityAnswer from the request body
  const { username, securityAnswer, newPassword } = req.body;
  
  try {
    // 💡 THE FIX: Pass all THREE arguments to the service
    await resetPassword(username, securityAnswer, newPassword);
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};