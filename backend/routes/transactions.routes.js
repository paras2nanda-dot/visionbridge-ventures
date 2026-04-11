import express from 'express';
import { getTransactions, createTransaction } from '../controllers/transactions.controller.js';
import { pool } from '../config/db.js';

const router = express.Router();

router.get('/', getTransactions);
router.post('/', createTransaction);

// UPDATE TRANSACTION
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const t = req.body;
  const user = req.user?.username || "System";

  try {
    // 💡 THE FIX: Changed 'date' to 'transaction_date' to match your DB exactly
    const query = `
      UPDATE transactions SET 
        amount=$1, transaction_date=$2, transaction_type=$3, platform=$4, notes=$5
      WHERE id=$6 RETURNING *`;
    
    // Using t.transaction_date (which the frontend now sends) or t.date as a fallback
    const values = [
      t.amount.toString().replace(/,/g, ''), 
      t.transaction_date || t.date, 
      t.transaction_type, 
      t.platform, 
      t.notes, 
      id
    ];

    const result = await pool.query(query, values);

    // 🕒 LOG ACTIVITY
    await pool.query(
      'INSERT INTO activities (user_name, action_type, entity_name, details) VALUES ($1, $2, $3, $4)',
      [user, 'UPDATE', t.client_name || 'Transaction', `Modified ${t.transaction_type} of ₹${t.amount} for ${t.client_name || 'Client'}`]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// DELETE TRANSACTION
router.delete('/:id', async (req, res) => {
  const user = req.user?.username || "System";
  try {
    // 1. Capture details for the log (Joining with clients to get the name safely)
    const transData = await pool.query(`
      SELECT c.full_name as client_name, t.amount, t.transaction_type 
      FROM transactions t 
      LEFT JOIN clients c ON t.client_id::TEXT = c.id::TEXT 
      WHERE t.id = $1`, [req.params.id]);
      
    if (transData.rows.length === 0) return res.status(404).json({ error: "Transaction not found" });
    
    const { client_name, amount, transaction_type } = transData.rows[0];

    // 2. Delete
    await pool.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);

    // 3. 🕒 LOG ACTIVITY
    await pool.query(
      'INSERT INTO activities (user_name, action_type, entity_name, details) VALUES ($1, $2, $3, $4)',
      [user, 'DELETE', client_name || 'Client', `Removed ${transaction_type} record of ₹${amount} for ${client_name || 'Client'}`]
    );

    res.json({ message: "Transaction Deleted" });
  } catch (err) {
    console.error("Delete Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;