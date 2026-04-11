import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ error: "Unauthorized access: Missing Token" });
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 🛡️ CRITICAL FIX: Ensure the entire decoded user object (including username) 
    // is attached to req.user so controllers can see it.
    req.user = decoded; 
    
    next();
  } catch (err) {
    res.clearCookie('token');
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export default authMiddleware;