/* eslint-disable no-unused-vars */
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

/**
 * 🛠️ VALIDATION ERROR HANDLER
 * Standardized to match the frontend error-handling logic.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // 🛡️ Return success: false to trigger frontend toasts correctly
    return res.status(400).json({ 
      success: false, 
      error: errors.array()[0].msg 
    });
  }
  next();
};

/**
 * 🔓 STANDARD AUTHENTICATION
 */
router.post("/login", [
  body('username').trim().notEmpty().withMessage("Username is required"),
  body('password').notEmpty().withMessage("Password is required")
], validate, login);

router.post("/reset-password", [
  body('username').trim().notEmpty().withMessage("Username required"),
  body('securityAnswer').trim().notEmpty().withMessage("Security answer required"),
  body('newPassword').isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
], validate, forgotPassword);

router.post("/logout", logout);

/**
 * 🛡️ BIOMETRIC (PASSKEY) REGISTRATION
 * Username is REQUIRED to link the hardware key to a specific account.
 */
router.post("/webauthn/register/generate", [
  body('username').trim().notEmpty().withMessage("Username required for registration")
], validate, generateRegOptions);

router.post("/webauthn/register/verify", [
  body('username').trim().notEmpty().withMessage("Username required"),
  body('data').notEmpty().withMessage("Hardware response data is missing")
], validate, verifyReg);

/**
 * 🔑 BIOMETRIC (PASSKEY) LOGIN
 * Username is OPTIONAL to support "Discoverable Credentials" (logging in 
 * just by touching the sensor without typing a name).
 */
router.post("/webauthn/login/generate", [
  body('username').optional().trim()
], validate, generateAuthOptions);

router.post("/webauthn/login/verify", [
  body('username').optional().trim(),
  body('data').notEmpty().withMessage("Hardware response data is missing")
], validate, verifyAuth);

/**
 * ⚙️ PASSKEY MANAGEMENT
 * Protected by authMiddleware to ensure only logged-in users 
 * can manage their own biometric devices.
 */
router.get("/webauthn/passkeys", authMiddleware, getPasskeys);
router.delete("/webauthn/passkeys/:id", authMiddleware, deletePasskey);

export default router;