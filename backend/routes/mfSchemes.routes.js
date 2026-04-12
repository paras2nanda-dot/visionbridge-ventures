import express from 'express';
import { 
  getSchemes, 
  createScheme, 
  updateScheme, 
  deleteScheme 
} from '../controllers/mfSchemes.controller.js';
import { authenticateToken } from '../middleware/authMiddleware.js'; // Ensure this is imported if used

const router = express.Router();

// 💡 Fixed: All routes now point to the controller logic
router.get('/', getSchemes);
router.post('/', createScheme);
router.put('/:id', updateScheme);
router.delete('/:id', deleteScheme);

export default router;