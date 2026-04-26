import express from 'express';
import { 
  getBusinessStats, 
  getLeaderboardsStats, 
  getClientDashboardStats,
  triggerMonthlySnapshot,
  getBusinessTotalAUM,
  // 🟢 CRIT-01: NEW IMPORT FOR SYSTEM BACKUP
  exportSystemBackup 
} from '../controllers/dashboard.controller.js';
import { getCharts } from '../controllers/charts.controller.js';

import { 
  getPendingReviews, 
  executeReview, 
  getReviewStats,
  searchEntitiesForReview, 
  getReviewHistory 
} from '../controllers/reviews.controller.js';

const router = express.Router();

/**
 * 🛠️ SYSTEM MAINTENANCE
 * Route: GET /api/dashboard/backup
 * 🟢 CRIT-01 FIX: Generates a full JSON export of all database tables.
 */
router.get('/backup', exportSystemBackup);

// --- Existing Routes ---

// Route: GET /api/dashboard/business
router.get('/business', getBusinessStats);

// Route: GET /api/dashboard/business-total-aum
router.get('/business-total-aum', getBusinessTotalAUM);

// Route: GET /api/dashboard/leaderboards
router.get('/leaderboards', getLeaderboardsStats);

// Route: GET /api/dashboard/client/:id
router.get('/client/:id', getClientDashboardStats); 

// Route: GET /api/dashboard/charts
router.get('/charts', getCharts);

/**
 * 📸 SNAPSHOT ENGINE
 */
router.post('/snapshot', triggerMonthlySnapshot);

/**
 * 🔒 REVIEW MODULE ROUTES (Phase-1)
 */
router.get('/reviews/stats', getReviewStats);
router.get('/reviews/pending', getPendingReviews);
router.get('/reviews/search', searchEntitiesForReview);
router.get('/reviews/history/:entity_type/:entity_id', getReviewHistory);
router.post('/reviews/execute', executeReview);

export default router;