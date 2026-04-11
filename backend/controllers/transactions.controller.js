import { pool } from '../config/db.js';
import { logActivity } from './activityController.js';

export const getTransactions = async (req, res) => {
  try {
    const query = `
      SELECT t.*, c.client_code, c.full_name as client_name, s.scheme_name 
      FROM transactions t
      JOIN clients c ON t.client_id::TEXT = c.id::TEXT
      JOIN mf_schemes s ON t.scheme_id::TEXT = s.id::TEXT
      ORDER BY t.transaction_date DESC`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createTransaction = async (req, res) => {
  const { transaction_id, transaction_date, client_id, scheme_id, transaction_type, amount, platform, notes } = req.body;
  const user = req.user?.username || "System";

  try {
    const result = await pool.query(
      `INSERT INTO transactions (transaction_id, transaction_date, client_id, scheme_id, transaction_type, amount, platform, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [transaction_id, transaction_date, client_id, scheme_id, transaction_type, amount, platform, notes]
    );

    const schemeNameRes = await pool.query('SELECT scheme_name FROM mf_schemes WHERE id = $1', [scheme_id]);
    const schemeName = schemeNameRes.rows[0]?.scheme_name || 'Mutual Fund';
    const clientNameRes = await pool.query('SELECT full_name FROM clients WHERE id = $1', [client_id]);
    const clientName = clientNameRes.rows[0]?.full_name || 'Client';

    // 🕒 Updated 4-argument Logger
    await logActivity(user, 'CREATE', clientName, `Invested ₹${new Intl.NumberFormat('en-IN').format(amount)} (${transaction_type}) in ${schemeName}`);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateTransaction = async (req, res) => {
  const { id } = req.params;
  const t = req.body;
  const user = req.user?.username || "System";

  try {
    const result = await pool.query(
      `UPDATE transactions SET 
        transaction_date = $1, client_id = $2, scheme_id = $3, transaction_type = $4, amount = $5, platform = $6, notes = $7
       WHERE id = $8 RETURNING *`,
      [t.transaction_date, t.client_id, t.scheme_id, t.transaction_type, t.amount, t.platform, t.notes, id]
    );
    
    // 🕒 Updated 4-argument Logger
    await logActivity(user, 'UPDATE', 'Transaction', `Modified investment entry of ₹${t.amount} for a client`);
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteTransaction = async (req, res) => {
  const { id } = req.params;
  const user = req.user?.username || "System";

  try {
    const transData = await pool.query('SELECT amount, transaction_type FROM transactions WHERE id = $1', [id]);
    const { amount, transaction_type } = transData.rows[0] || { amount: 0, transaction_type: 'Investment' };

    await pool.query('DELETE FROM transactions WHERE id = $1', [id]);
    
    // 🕒 Updated 4-argument Logger
    await logActivity(user, 'DELETE', 'Transaction', `Removed ${transaction_type} record of ₹${amount}`);
    
    res.json({ message: "Transaction deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};