import express from 'express';
import { getClientDashboard } from '../controllers/clientDashboard.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

// Aligning route parameter name with the controller
router.get('/:clientId', authMiddleware, getClientDashboard);

export default router;