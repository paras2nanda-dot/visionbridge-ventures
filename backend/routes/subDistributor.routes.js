import express from 'express';
import { 
    getSubDistributors, 
    createSubDistributor, 
    updateSubDistributor, 
    deleteSubDistributor,
    getSubDistributorPerformance // 🟢 NEW: PERFORMANCE LOGIC
} from '../controllers/subDistributor.controller.js';

const router = express.Router();

// 🟢 Performance & Analytics Route
router.get('/:id/performance', getSubDistributorPerformance);

// 📋 Standard CRUD Routes
router.get('/', getSubDistributors);
router.post('/', createSubDistributor);
router.put('/:id', updateSubDistributor);
router.delete('/:id', deleteSubDistributor);

export default router;