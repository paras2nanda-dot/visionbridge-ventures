import express from 'express';
import { getSips, createSip, updateSip, deleteSip, bulkDeleteSips } from '../controllers/sips.controller.js';
import authMiddleware from '../middleware/auth.middleware.js'; 

const router = express.Router();

router.get('/', authMiddleware, getSips);
router.post('/', authMiddleware, createSip);
router.put('/:id', authMiddleware, updateSip);
router.delete('/:id', authMiddleware, deleteSip);

// 💡 NEW: Route for Bulk Deletion
router.post('/bulk-delete', authMiddleware, bulkDeleteSips);

export default router;