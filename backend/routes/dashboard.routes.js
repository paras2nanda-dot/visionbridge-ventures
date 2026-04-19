import express from 'express';
import { 
  getBusinessStats, 
  getLeaderboardsStats, 
  getClientDashboardStats,
  triggerMonthlySnapshot // 🟢 NEW IMPORT
} from '../controllers/dashboard.controller.js';
import { getCharts } from '../controllers/charts.controller.js';

const router = express.Router();

// Route: GET /api/dashboard/business
router.get('/business', getBusinessStats);

// Route: GET /api/dashboard/leaderboards
router.get('/leaderboards', getLeaderboardsStats);

// Route: GET /api/dashboard/client/:id
router.get('/client/:id', getClientDashboardStats); 

// Route: GET /api/dashboard/charts
router.get('/charts', getCharts);

/**
 * 📸 SNAPSHOT ENGINE
 * Route: POST /api/dashboard/snapshot
 * Triggers a historical data capture for the Analytics Trend Charts
 */
router.post('/snapshot', triggerMonthlySnapshot);

export default router;