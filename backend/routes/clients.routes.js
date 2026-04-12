import express from 'express';
import { 
  getClients, 
  createClient, 
  updateClient, 
  deleteClient, 
  bulkDeleteClients 
} from '../controllers/clients.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, getClients);
router.post('/', authMiddleware, createClient);
router.put('/:id', authMiddleware, updateClient);
router.delete('/:id', authMiddleware, deleteClient);

// 💡 NEW: Bulk Delete Endpoint
router.post('/bulk-delete', authMiddleware, bulkDeleteClients);

export default router;