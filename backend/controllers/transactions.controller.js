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
    const clientRes = await pool.query('SELECT full_name FROM clients WHERE id::TEXT = $1::TEXT', [client_id]);
    
    const schemeName = schemeRes.rows[0]?.scheme_name || 'Scheme';
    const clientName = clientRes.rows[0]?.full_name || 'Client';

    await logActivity(user, 'CREATE', clientName, `💰 ${transaction_type}: ₹${new Intl.NumberFormat('en-IN').format(cleanAmount)}\n• Scheme: ${schemeName}`);

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
    const oldRes = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    if (oldRes.rows.length === 0) return res.status(404).json({ error: "Not found" });
    const old = oldRes.rows[0];

    const cleanAmount = t.amount.toString().replace(/,/g, '');
    await pool.query(
      `UPDATE transactions SET transaction_date = $1, client_id = $2, scheme_id = $3, transaction_type = $4, amount = $5, platform = $6, notes = $7 WHERE id = $8`,
      [t.transaction_date, t.client_id, t.scheme_id, t.transaction_type, cleanAmount, t.platform, t.notes, id]
    );

    let changes = [];
    if (String(old.amount) !== String(cleanAmount)) changes.push(`• Amount: ₹${old.amount} → ₹${cleanAmount}`);
    if (old.transaction_type !== t.transaction_type) changes.push(`• Type: ${old.transaction_type} → ${t.transaction_type}`);
    if (old.platform !== t.platform) changes.push(`• Platform: ${old.platform} → ${t.platform}`);

    const detailMsg = changes.length > 0 ? `Updated transaction:\n${changes.join('\n')}` : "Updated transaction metadata.";
    await logActivity(user, 'UPDATE', t.client_name || 'Transaction', detailMsg);

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteTransaction = async (req, res) => {
  const { id } = req.params;
  const user = req.user?.username || "System";

  try {
    const transData = await pool.query(`
        SELECT t.amount, t.transaction_type, c.full_name as client_name, s.scheme_name 
        FROM transactions t
        JOIN clients c ON t.client_id::TEXT = c.id::TEXT
        JOIN mf_schemes s ON t.scheme_id::TEXT = s.id::TEXT
        WHERE t.id = $1`, [id]);

    if (transData.rows.length === 0) return res.status(404).json({ error: "Not found" });
    
    const { amount, transaction_type, client_name, scheme_name } = transData.rows[0];

    await pool.query('DELETE FROM transactions WHERE id = $1', [id]);
    await logActivity(user, 'DELETE', client_name, `🗑️ Deleted ${transaction_type} record:\n• Amount: ₹${amount}\n• Scheme: ${scheme_name}`);
    
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const bulkDeleteTransactions = async (req, res) => {
  const { ids } = req.body;
  const user = req.user?.username || "System";
  try {
    // 💡 CASTING FIX: Ensures array elements are strings for PostgreSQL ANY clause
    const cleanIds = ids.map(id => String(id));
    await pool.query('DELETE FROM transactions WHERE id::text = ANY($1::text[])', [cleanIds]);
    
    await logActivity(user, 'DELETE', 'Transactions', `🚨 Bulk deleted ${ids.length} transactions.`);
    res.json({ message: "Success" });
  } catch (err) {
    console.error("Bulk Delete Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};