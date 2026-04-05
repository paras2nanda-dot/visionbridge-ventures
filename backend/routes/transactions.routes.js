import express from 'express';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '../controllers/transactions.controller.js';

const router = express.Router();

router.get('/', getTransactions);
router.post('/', createTransaction);
router.put('/:id', updateTransaction); // ✅ NEW: Put Route for Editing
router.delete('/:id', deleteTransaction);

export default router;