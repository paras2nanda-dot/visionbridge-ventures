import express from 'express';
import { 
  getSchemes, 
  createScheme, 
  updateScheme, 
  deleteScheme 
} from '../controllers/mfSchemes.controller.js';

const router = express.Router();

// 💡 Fixed: Routes now point to the controller functions
router.get('/', getSchemes);
router.post('/', createScheme);
router.put('/:id', updateScheme);
router.delete('/:id', deleteScheme);

export default router;