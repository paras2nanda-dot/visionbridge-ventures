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
  getReviewStats,
  searchEntitiesForReview, // 🔍 Added for Ad-hoc Search
  getReviewHistory // 📜 NEW: Added for Audit History
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
// Returns counts for Overdue, Due in 7 Days, and Completed in 7 Days cards
router.get('/reviews/stats', getReviewStats);

// Route: GET /api/dashboard/reviews/pending
// Returns list of all pending Client and valid Family reviews
router.get('/reviews/pending', getPendingReviews);

// Route: GET /api/dashboard/reviews/search
// 🔍 Searches for any Client or Family to initiate a manual review
router.get('/reviews/search', searchEntitiesForReview);

// Route: GET /api/dashboard/reviews/history/:entity_type/:entity_id
// 📜 NEW: Fetches the full history of past reviews for a specific client or family
router.get('/reviews/history/:entity_type/:entity_id', getReviewHistory);

// Route: POST /api/dashboard/reviews/execute
// Logs the review outcome and schedules the next review date
router.post('/reviews/execute', executeReview);

export default router;