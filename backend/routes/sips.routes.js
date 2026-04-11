import express from 'express';
import { getSips, createSip, updateSip, deleteSip } from '../controllers/sips.controller.js';
// Note: If you use authMiddleware in other routes, you should add it here too
import authMiddleware from '../middleware/auth.middleware.js'; 

const router = express.Router();

router.get('/', authMiddleware, getSips);
router.post('/', authMiddleware, createSip);
router.put('/:id', authMiddleware, updateSip);
router.delete('/:id', authMiddleware, deleteSip);

export default router;