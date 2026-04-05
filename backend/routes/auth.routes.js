import express from "express";
import { login, forgotPassword } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/login", login);
router.post("/reset-password", forgotPassword);

export default router;