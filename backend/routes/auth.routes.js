import express from "express";
import { body, validationResult } from "express-validator";
import { login, forgotPassword, logout } from "../controllers/auth.controller.js";

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
 * 🔓 Login Route
 * We removed the "min: 6" check here because if a user already has 
 * a shorter password in the DB, this validator would block them.
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

export default router;