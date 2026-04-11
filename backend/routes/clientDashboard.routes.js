import express from 'express';
import { getClientDashboard } from '../controllers/clientDashboard.controller.js';

const router = express.Router();

// Matches the controller function name for consistency
router.get('/:clientId', getClientDashboard);

export default router;