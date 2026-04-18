import express from 'express';
import { getBusinessStats, getClientDashboardStats, getLeaderboardsStats } from '../controllers/dashboard.controller.js';
import { getCharts } from '../controllers/charts.controller.js';

const router = express.Router();

// Route: GET /api/dashboard/business (Your existing view)
router.get('/business', getBusinessStats);

// Route: GET /api/dashboard/leaderboards (The new Leaderboards view)
router.get('/leaderboards', getLeaderboardsStats);

// Route: GET /api/dashboard/client/:id (The new searchable view)
router.get('/client/:id', getClientDashboardStats); 

router.get('/charts', getCharts);

export default router;