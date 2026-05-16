/* eslint-disable no-unused-vars */
import express from 'express';
import { 
  getClients, 
  createClient, 
  updateClient, 
  deleteClient, 
  bulkDeleteClients,
  getFamilies 
} from '../controllers/clients.controller.js';

const router = express.Router();

/**
 * 👥 CLIENT & FAMILY MANAGEMENT ROUTES
 * Standardized Order: Specific Paths -> General/Collection Paths -> Parameterized Paths
 */

// 1. Specific Static Routes (Must stay at the top)
// Fetches the unique list of family groups for the dropdowns
router.get('/families', getFamilies);

// 2. Collection Routes
router.get('/', getClients);
router.post('/', createClient);

// 3. 💡 BEST PRACTICE: Group Specific Actions
// Using POST for bulk operations allows for a body containing an array of IDs
router.post('/bulk-delete', bulkDeleteClients);

// 4. Parameterized Member Routes
// These handle actions on a single specific client record
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

export default router;