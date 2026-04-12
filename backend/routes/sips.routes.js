import express from 'express';
import { getSips, createSip, updateSip, deleteSip, bulkDeleteSips } from '../controllers/sips.controller.js';

const router = express.Router();

// 💡 Using direct routes to avoid file-naming/middleware crashes
router.get('/', getSips);
router.post('/', createSip);
router.put('/:id', updateSip);
router.delete('/:id', deleteSip);

// 💡 Correct Bulk Delete endpoint path
router.post('/bulk-delete', bulkDeleteSips);

export default router;