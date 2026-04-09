import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) return res.status(401).json({ error: "Unauthorized access" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.clearCookie('token');
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export default authMiddleware;