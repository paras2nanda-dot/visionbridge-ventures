import express from 'express';
import { 
  getClients, 
  createClient, 
  updateClient, 
  deleteClient, 
  bulkDeleteClients,
  getFamilies // 🟢 Added to handle family master data
} from '../controllers/clients.controller.js';

const router = express.Router();

// 🟢 NEW: Families Master Route (must be before or distinct from parameterized routes)
router.get('/families', getFamilies);

router.get('/', getClients);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

// 💡 Bulk Delete Endpoint
router.post('/bulk-delete', bulkDeleteClients);

export default router;