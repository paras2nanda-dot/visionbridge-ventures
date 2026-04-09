import express from "express";
import { body, validationResult } from "express-validator";
import { login, forgotPassword, logout } from "../controllers/auth.controller.js";

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  next();
};

router.post("/login", [
  body('username').trim().notEmpty().withMessage("Username required"),
  body('password').isLength({ min: 6 }).withMessage("Password too short")
], validate, login);

router.post("/reset-password", [
  body('username').trim().notEmpty(),
  body('securityAnswer').trim().notEmpty(),
  body('newPassword').isLength({ min: 6 })
], validate, forgotPassword);

router.post("/logout", logout);

export default router;