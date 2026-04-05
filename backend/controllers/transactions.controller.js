import { pool } from '../config/db.js';

export const getTransactions = async (req, res) => {
  try {
    const query = `
      SELECT t.*, c.client_code, c.full_name as client_name, s.scheme_name 
      FROM transactions t
      JOIN clients c ON t.client_id = c.id
      JOIN mf_schemes s ON t.scheme_id = s.id
      ORDER BY t.transaction_date DESC`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createTransaction = async (req, res) => {
  const { transaction_id, transaction_date, client_id, scheme_id, transaction_type, amount, platform, notes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO transactions (transaction_id, transaction_date, client_id, scheme_id, transaction_type, amount, platform, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [transaction_id, transaction_date, client_id, scheme_id, transaction_type, amount, platform, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateTransaction = async (req, res) => {
  const { id } = req.params;
  const { transaction_date, client_id, scheme_id, transaction_type, amount, platform, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE transactions SET 
        transaction_date = $1, client_id = $2, scheme_id = $3, transaction_type = $4, amount = $5, platform = $6, notes = $7
       WHERE id = $8 RETURNING *`,
      [transaction_date, client_id, scheme_id, transaction_type, amount, platform, notes, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    await pool.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
    res.json({ message: "Transaction deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};