import express from 'express';
import { 
  getTransactions, 
  createTransaction, 
  updateTransaction, 
  deleteTransaction, 
  bulkDeleteTransactions 
} from '../controllers/transactions.controller.js';

const router = express.Router();

router.get('/', getTransactions);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

// 💡 Correct Bulk Delete endpoint path
router.post('/bulk-delete', bulkDeleteTransactions);

export default router;