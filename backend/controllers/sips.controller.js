import { pool } from '../config/db.js';
import { logActivity } from './activityController.js';

export const getSips = async (req, res) => {
  try {
    const query = `
      SELECT s.*, 
             TO_CHAR(s.start_date, 'YYYY-MM-DD') as start_date, 
             TO_CHAR(s.end_date, 'YYYY-MM-DD') as end_date,
             c.client_code, c.full_name as client_name, mf.scheme_name 
      FROM sips s
      JOIN clients c ON s.client_id::TEXT = c.id::TEXT
      JOIN mf_schemes mf ON s.scheme_id::TEXT = mf.id::TEXT
      ORDER BY s.start_date DESC`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

export const createSip = async (req, res) => {
  const s = req.body;
  const user = req.user?.username || "System"; 
  try {
    const query = `INSERT INTO sips (sip_id, client_id, scheme_id, amount, start_date, end_date, frequency, sip_day, status, platform, notes, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`;
    const values = [s.sip_id, s.client_id, s.scheme_id, s.amount, s.start_date, s.end_date || null, s.frequency, s.sip_day, s.status, s.platform, s.notes, s.status === 'Active'];
    const result = await pool.query(query, values);
    await logActivity(user, 'CREATE', s.sip_id, `Started SIP ₹${s.amount} for Client ${s.client_id}`);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

export const updateSip = async (req, res) => {
  const { id } = req.params;
  const s = req.body;
  const user = req.user?.username || "System";
  try {
    // 💡 FIXED: Added scheme_id to the UPDATE query
    const query = `UPDATE sips SET amount=$1, start_date=$2, end_date=$3, frequency=$4, sip_day=$5, status=$6, platform=$7, notes=$8, is_active=$9, scheme_id=$10 WHERE id=$11 RETURNING *`;
    const values = [s.amount, s.start_date, s.end_date || null, s.frequency, s.sip_day, s.status, s.platform, s.notes, s.status === 'Active', s.scheme_id, id];
    const result = await pool.query(query, values);
    await logActivity(user, 'UPDATE', s.sip_id, `Updated SIP mandate ${s.sip_id}`);
    res.json(result.rows[0]);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

export const deleteSip = async (req, res) => {
  const { id } = req.params;
  const user = req.user?.username || "System";
  try {
    await pool.query('DELETE FROM sips WHERE id = $1', [id]);
    await logActivity(user, 'DELETE', 'SIP', `Deleted SIP record`);
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// 💡 NEW: Bulk Delete Handler
export const bulkDeleteSips = async (req, res) => {
  const { ids } = req.body;
  const user = req.user?.username || "System";
  try {
    await pool.query('DELETE FROM sips WHERE id = ANY($1::text[])', [ids]);
    await logActivity(user, 'DELETE', 'SIP', `Bulk deleted ${ids.length} SIP records`);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};