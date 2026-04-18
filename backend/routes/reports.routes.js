import express from 'express';
import { 
  downloadClientAumReport, 
  downloadSchemeAumReport,
  downloadMonthlySipBookReport,
  downloadMonthlyCommissionReport,
  downloadFullClientsDatabase,
  downloadFullSchemeDatabase,
  downloadSubDistributorReport // 🟢 NEW: INDIVIDUAL PARTNER REPORT
} from '../controllers/reports.controller.js';

const router = express.Router();

// --- NEW: PARTNER-SPECIFIC CLIENT REPORT ---
// Route: /api/reports/sub-distributor/:id
router.get('/sub-distributor/:id', downloadSubDistributorReport);

// --- REPORT 1: CLIENT-WISE AUM ---
router.get('/client-aum', downloadClientAumReport);

// --- REPORT 2: SCHEME-WISE AUM ---
router.get('/scheme-aum', downloadSchemeAumReport);

// --- REPORT 3: MONTHLY SIP BOOK ---
router.get('/sip-book', downloadMonthlySipBookReport);

// --- REPORT 4: MONTHLY COMMISSION REPORT ---
router.get('/commission-report', downloadMonthlyCommissionReport);

// --- REPORT 5: FULL CLIENTS DATABASE ---
router.get('/clients-database', downloadFullClientsDatabase);

// --- REPORT 6: FULL MF SCHEMES DATABASE ---
router.get('/schemes-database', downloadFullSchemeDatabase);

export default router;