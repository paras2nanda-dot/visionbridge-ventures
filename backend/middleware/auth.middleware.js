import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  // 1. Try to get token from cookies FIRST
  let token = req.cookies?.token;

  // 2. Fallback: Check if the frontend sent it in the headers instead
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // 3. If still no token, log it and block access
  if (!token) {
    console.error("🔴 Auth Error: No token found in cookies or headers.");
    return res.status(401).json({ error: "Unauthorized access: Missing Token" });
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";
    req.user = jwt.verify(token, JWT_SECRET);
    
    // Success! Move to the next function
    next();
  } catch (err) {
    // 4. Log exactly WHY it failed (e.g., "jwt expired", "invalid signature")
    console.error("🔴 Auth Error: Token verification failed ->", err.message);
    
    res.clearCookie('token');
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export default authMiddleware;