import express from 'express';
import { getClientDashboardStats } from '../controllers/dashboard.controller.js';

const router = express.Router();

// This matches the function name in your dashboard.controller.js
router.get('/:id', getClientDashboardStats);

export default router;