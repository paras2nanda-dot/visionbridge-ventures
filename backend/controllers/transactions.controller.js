import { pool } from '../config/db.js';
import { logActivity } from './activityController.js';

// Helper function to swap IDs for Names in snapshots
const enhanceSnapshotWithNames = async (snapshot) => {
  if (!snapshot) return null;
  const enhanced = { ...snapshot };

  if (enhanced.client_id) {
    const clientRes = await pool.query('SELECT full_name FROM clients WHERE id::TEXT = $1::TEXT', [enhanced.client_id]);
    enhanced.client_name = clientRes.rows[0]?.full_name || enhanced.client_id;
    delete enhanced.client_id; // Remove the raw ID so it doesn't show in the diff
  }

  if (enhanced.scheme_id) {
    const schemeRes = await pool.query('SELECT scheme_name FROM mf_schemes WHERE id::TEXT = $1::TEXT', [enhanced.scheme_id]);
    enhanced.scheme_name = schemeRes.rows[0]?.scheme_name || enhanced.scheme_id;
    delete enhanced.scheme_id; // Remove the raw ID
  }

  return enhanced;
};

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
    const newTx = result.rows[0];

    // Enhance the new snapshot with names before logging
    const enhancedNewTx = await enhanceSnapshotWithNames(newTx);

    // Forensic Log: Capture the full new object (now with names)
    await logActivity(
        user, 
        'CREATE', 
        enhancedNewTx.client_name, 
        `💰 Recorded new ${transaction_type} of ₹${new Intl.NumberFormat('en-IN').format(cleanAmount)} for ${enhancedNewTx.scheme_name}.`,
        null,
        enhancedNewTx
    );

    res.status(201).json(newTx);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateTransaction = async (req, res) => {
  const { id } = req.params;
  const t = req.body;
  const user = req.user?.username || "System";

  try {
    // 1. Snapshot BEFORE update
    const oldRes = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    if (oldRes.rows.length === 0) return res.status(404).json({ error: "Not found" });
    const oldData = oldRes.rows[0];

    const cleanAmount = t.amount.toString().replace(/,/g, '');
    
    // Added RETURNING * to capture the post-update state
    const updateQuery = `UPDATE transactions SET transaction_date = $1, client_id = $2, scheme_id = $3, transaction_type = $4, amount = $5, platform = $6, notes = $7 WHERE id = $8 RETURNING *`;
    
    // 2. Snapshot AFTER update
    const result = await pool.query(updateQuery, [t.transaction_date, t.client_id, t.scheme_id, t.transaction_type, cleanAmount, t.platform, t.notes, id]);
    const newData = result.rows[0];

    // 💡 ENHANCEMENT: Swap IDs for Names in both snapshots
    const enhancedOldData = await enhanceSnapshotWithNames(oldData);
    const enhancedNewData = await enhanceSnapshotWithNames(newData);

    // Clean summary title for the Activity Feed
    const detailMsg = `Updated transaction parameters (${newData.transaction_id}).`;

    // Forensic Log: Capture both enhanced snapshots
    await logActivity(user, 'UPDATE', enhancedNewData.client_name || 'Transaction', detailMsg, enhancedOldData, enhancedNewData);

    res.json({ success: true, data: newData });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteTransaction = async (req, res) => {
  const { id } = req.params;
  const user = req.user?.username || "System";

  try {
    // 1. Snapshot BEFORE deletion (grabbing all data)
    const transData = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    if (transData.rows.length === 0) return res.status(404).json({ error: "Not found" });
    const deletedRecord = transData.rows[0];

    await pool.query('DELETE FROM transactions WHERE id = $1', [id]);
    
    // Enhance the snapshot with names before logging
    const enhancedDeletedRecord = await enhanceSnapshotWithNames(deletedRecord);

    // Forensic Log: Pass enhanced deleted record as old_data
    await logActivity(
        user, 
        'DELETE', 
        enhancedDeletedRecord.client_name, 
        `🗑️ Deleted ${enhancedDeletedRecord.transaction_type} record (${enhancedDeletedRecord.transaction_id}).`,
        enhancedDeletedRecord,
        null
    );
    
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const bulkDeleteTransactions = async (req, res) => {
  const { ids } = req.body;
  const user = req.user?.username || "System";
  try {
    const cleanIds = ids.map(id => String(id));
    
    // 1. Snapshot of all records about to be deleted
    const recordsToPurge = await pool.query('SELECT * FROM transactions WHERE id::text = ANY($1::text[])', [cleanIds]);
    
    // Enhance all snapshots in the batch
    const enhancedSnapshots = await Promise.all(recordsToPurge.rows.map(enhanceSnapshotWithNames));

    await pool.query('DELETE FROM transactions WHERE id::text = ANY($1::text[])', [cleanIds]);
    
    // Forensic Log: Store the purged batch
    await logActivity(
        user, 
        'DELETE', 
        'Transactions', 
        `🚨 Execution of bulk deletion for ${ids.length} transactions.`,
        { deleted_records: enhancedSnapshots },
        null
    );
    
    res.json({ message: "Success" });
  } catch (err) {
    console.error("Bulk Delete Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};