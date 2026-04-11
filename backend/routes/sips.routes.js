import express from 'express';
import { getSips, createSip, updateSip, deleteSip } from '../controllers/sips.controller.js';

const router = express.Router();

// 💡 Routes are now simplified and clean
router.get('/', getSips);
router.post('/', createSip);
router.put('/:id', updateSip);
router.delete('/:id', deleteSip);

export default router;