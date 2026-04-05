import express from 'express';
import { getSips, createSip, updateSip, deleteSip } from '../controllers/sips.controller.js';

const router = express.Router();

router.get('/', getSips);
router.post('/', createSip);
router.put('/:id', updateSip);
router.delete('/:id', deleteSip);

export default router;