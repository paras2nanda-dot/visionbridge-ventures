import express from "express";
import { body, validationResult } from "express-validator";
import { 
  login, 
  forgotPassword, 
  logout,
  generateRegOptions,
  verifyReg,
  generateAuthOptions,
  verifyAuth,
  getPasskeys,
  deletePasskey 
} from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// 🛠️ Middleware to catch validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

/**
 * 🔓 Standard Login Route
 */
router.post("/login", [
  body('username').trim().notEmpty().withMessage("Username is required"),
  body('password').notEmpty().withMessage("Password is required")
], validate, login);

/**
 * 🔄 Reset Password Route
 */
router.post("/reset-password", [
  body('username').trim().notEmpty().withMessage("Username required"),
  body('securityAnswer').trim().notEmpty().withMessage("Security answer required"),
  body('newPassword').isLength({ min: 6 }).withMessage("New password must be at least 6 characters")
], validate, forgotPassword);

/**
 * 🚪 Logout Route
 */
router.post("/logout", logout);

// ==========================================
// 🛡️ BIOMETRIC (WEBAUTHN/PASSKEY) ROUTES
// ==========================================

// Phase 1: Registration (Username STILL REQUIRED here)
router.post("/webauthn/register/generate", [
  body('username').trim().notEmpty().withMessage("Username required")
], validate, generateRegOptions);

router.post("/webauthn/register/verify", [
  body('username').trim().notEmpty().withMessage("Username required"),
  body('data').notEmpty().withMessage("Biometric data required")
], validate, verifyReg);

// Phase 2: Authentication (Username is now OPTIONAL for Discoverable Login)
router.post("/webauthn/login/generate", [
  body('username').optional().trim()
], validate, generateAuthOptions);

router.post("/webauthn/login/verify", [
  body('username').optional().trim(),
  body('data').notEmpty().withMessage("Biometric data required")
], validate, verifyAuth);

// ==========================================
// ⚙️ PASSKEY MANAGEMENT ROUTES
// ==========================================

router.get("/webauthn/passkeys", authMiddleware, getPasskeys);
router.delete("/webauthn/passkeys/:id", authMiddleware, deletePasskey);

export default router;