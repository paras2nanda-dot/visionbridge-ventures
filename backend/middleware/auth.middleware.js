/* eslint-disable no-unused-vars */
import jwt from 'jsonwebtoken';

/**
 * 🛡️ AUTHENTICATION MIDDLEWARE
 * Standardizes security across all protected routes.
 * C-2 FIX: Removed weak hardcoded fallback secret.
 */
const authMiddleware = (req, res, next) => {
  let token = null;

  // 1. PRIMARY: Check if the frontend sent a fresh token in the Authorization headers
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // 2. FALLBACK: Try to get token from httpOnly cookies
  if (!token && req.cookies?.token) {
    token = req.cookies.token;
  }

  // 3. Block access if no token exists
  if (!token) {
    return res.status(401).json({ 
        success: false, 
        error: "Unauthorized: Please login to continue." 
    });
  }

  try {
    /**
     * 🛡️ ENFORCED SECURITY
     * The system now requires a valid environment variable. 
     * 'index.js' will prevent the server from starting if this is missing.
     */
    const JWT_SECRET = process.env.JWT_SECRET;
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 🛡️ CRITICAL: Attach decoded user (username, role, id) to the request
    // This is required for the Audit Middleware to track 'performed_by'
    req.user = decoded; 
    
    next();
  } catch (err) {
    console.error("🔒 Security Alert: Invalid Token Attempt ->", err.message);
    
    // Clear the tainted cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'None'
    });

    return res.status(401).json({ 
        success: false, 
        error: "Session expired or invalid. Please login again." 
    });
  }
};

export default authMiddleware;