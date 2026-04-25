import express from 'express';
import { 
  getBusinessStats, 
  getLeaderboardsStats, 
  getClientDashboardStats,
  triggerMonthlySnapshot,
  getBusinessTotalAUM // 🟢 NEW IMPORT FOR FAMILY % CALCULATION
} from '../controllers/dashboard.controller.js';
import { getCharts } from '../controllers/charts.controller.js';

// 🟢 NEW IMPORTS FOR REVIEW MODULE (Phase-1)
import { 
  getPendingReviews, 
  executeReview, 
  getReviewStats 
} from '../controllers/reviews.controller.js';

const router = express.Router();

// Route: GET /api/dashboard/business
router.get('/business', getBusinessStats);

// 🟢 Route: GET /api/dashboard/business-total-aum
// Provides the global denominator for "Family % of Total Business" card
router.get('/business-total-aum', getBusinessTotalAUM);

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

/**
 * 🔒 REVIEW MODULE ROUTES (Phase-1)
 */

// Route: GET /api/dashboard/reviews/stats
// Returns counts for Overdue and Due in 7 Days cards
router.get('/reviews/stats', getReviewStats);

// Route: GET /api/dashboard/reviews/pending
// Returns list of all pending Client and valid Family reviews
router.get('/reviews/pending', getPendingReviews);

// Route: POST /api/dashboard/reviews/execute
// Logs the review outcome and schedules the next review date
router.post('/reviews/execute', executeReview);

export default router;