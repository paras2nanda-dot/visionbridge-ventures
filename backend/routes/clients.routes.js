import express from 'express';
import { 
  getClients, 
  createClient, 
  updateClient, 
  deleteClient, 
  bulkDeleteClients 
} from '../controllers/clients.controller.js';

const router = express.Router();

router.get('/', getClients);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

// 💡 Bulk Delete Endpoint
router.post('/bulk-delete', bulkDeleteClients);

export default router;