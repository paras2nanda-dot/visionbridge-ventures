import { pool } from '../config/db.js';
import { logActivity } from './activityController.js';

export const getTransactions = async (req, res) => {
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
};

export const createTransaction = async (req, res) => {
  const { transaction_id, transaction_date, client_id, scheme_id, transaction_type, amount, platform, notes } = req.body;
  const user = req.user?.username || "System";

  try {
    const cleanAmount = amount.toString().replace(/,/g, '');
    const result = await pool.query(
      `INSERT INTO transactions (transaction_id, transaction_date, client_id, scheme_id, transaction_type, amount, platform, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [transaction_id, transaction_date, client_id, scheme_id, transaction_type, cleanAmount, platform, notes]
    );

    const schemeRes = await pool.query('SELECT scheme_name FROM mf_schemes WHERE id::TEXT = $1::TEXT', [scheme_id]);
    const schemeName = schemeRes.rows[0]?.scheme_name || 'Mutual Fund';
    const clientRes = await pool.query('SELECT full_name FROM clients WHERE id::TEXT = $1::TEXT', [client_id]);
    const clientName = clientRes.rows[0]?.full_name || 'Client';

    await logActivity(user, 'CREATE', clientName, `${transaction_type}: ₹${new Intl.NumberFormat('en-IN').format(cleanAmount)} in ${schemeName}`);

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
    const cleanAmount = t.amount.toString().replace(/,/g, '');
    const result = await pool.query(
      `UPDATE transactions SET 
        transaction_date = $1, client_id = $2, scheme_id = $3, transaction_type = $4, amount = $5, platform = $6, notes = $7
       WHERE id = $8 RETURNING *`,
      [t.transaction_date, t.client_id, t.scheme_id, t.transaction_type, cleanAmount, t.platform, t.notes, id]
    );
    
    await logActivity(user, 'UPDATE', t.client_name || 'Transaction', `Modified entry: ₹${cleanAmount} (${t.transaction_type})`);
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
    if (transData.rows.length === 0) return res.status(404).json({ error: "Not found" });
    
    const amount = transData.rows[0]?.amount || 0;
    const type = transData.rows[0]?.transaction_type || '';

    await pool.query('DELETE FROM transactions WHERE id = $1', [id]);
    await logActivity(user, 'DELETE', 'Transaction', `Removed ${type} record of ₹${amount}`);
    
    res.json({ message: "Transaction deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 💡 NEW: Bulk Delete Handler
export const bulkDeleteTransactions = async (req, res) => {
  const { ids } = req.body;
  const user = req.user?.username || "System";
  try {
    await pool.query('DELETE FROM transactions WHERE id = ANY($1::text[])', [ids]);
    await logActivity(user, 'DELETE', 'Transactions', `Bulk deleted ${ids.length} transaction records`);
    res.json({ message: "Transactions deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};