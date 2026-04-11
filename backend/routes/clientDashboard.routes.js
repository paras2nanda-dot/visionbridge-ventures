import express from 'express';
import { getClientDashboard } from '../controllers/clientDashboard.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

// The ':id' here must match the 'id' we destructure in the controller
router.get('/:id', authMiddleware, getClientDashboard);

export default router;