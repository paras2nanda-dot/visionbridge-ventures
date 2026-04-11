import express from 'express';
import { createTransaction } from '../controllers/transactions.controller.js';
import { pool } from '../config/db.js';

const router = express.Router();

// 💡 FETCH TRANSACTIONS (Latest First + Formatted Dates)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT t.*, 
             TO_CHAR(t.transaction_date, 'YYYY-MM-DD') as transaction_date,
             c.client_code, c.full_name as client_name, s.scheme_name 
      FROM transactions t
      JOIN clients c ON t.client_id::TEXT = c.id::TEXT
      JOIN mf_schemes s ON t.scheme_id::TEXT = s.id::TEXT
      ORDER BY t.transaction_date DESC, t.created_at DESC`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', createTransaction);

// UPDATE TRANSACTION
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const t = req.body;
  const user = req.user?.username || "System";

  try {
    const query = `
      UPDATE transactions SET 
        amount=$1, 
        transaction_date=$2, 
        transaction_type=$3, 
        platform=$4, 
        notes=$5,
        scheme_id=$6,
        client_id=$7
      WHERE id=$8 RETURNING *`;
    
    const values = [
      t.amount.toString().replace(/,/g, ''), 
      t.transaction_date, 
      t.transaction_type, 
      t.platform, 
      t.notes,
      t.scheme_id,
      t.client_id,
      id
    ];

    const result = await pool.query(query, values);

    // Activity Log
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
    const transData = await pool.query(`
      SELECT c.full_name as client_name, t.amount, t.transaction_type 
      FROM transactions t 
      LEFT JOIN clients c ON t.client_id::TEXT = c.id::TEXT 
      WHERE t.id = $1`, [req.params.id]);
      
    if (transData.rows.length === 0) return res.status(404).json({ error: "Transaction not found" });
    const { client_name, amount, transaction_type } = transData.rows[0];

    await pool.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);

    await pool.query(
      'INSERT INTO activities (user_name, action_type, entity_name, details) VALUES ($1, $2, $3, $4)',
      [user, 'DELETE', client_name || 'Client', `Removed ${transaction_type} record of ₹${amount}`]
    );

    res.json({ message: "Transaction Deleted" });
  } catch (err) {
    console.error("Delete Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;