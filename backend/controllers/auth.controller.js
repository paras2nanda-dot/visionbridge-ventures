import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

const authMiddleware = (req, res, next) => {
  // 🛡️ Extract token from HttpOnly Cookie
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Access denied. No session found." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (err) {
    res.clearCookie('token');
    res.status(401).json({ error: "Session expired or invalid" });
  }
};

export default authMiddleware;