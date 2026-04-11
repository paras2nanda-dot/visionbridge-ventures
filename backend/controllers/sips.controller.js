import { pool } from '../config/db.js';
import { logActivity } from './activityController.js';

export const getSips = async (req, res) => {
  try {
    const query = `
      SELECT s.*, c.client_code, c.full_name as client_name, mf.scheme_name 
      FROM sips s
      JOIN clients c ON s.client_id = c.id
      JOIN mf_schemes mf ON s.scheme_id = mf.id
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
    const query = `
      INSERT INTO sips (sip_id, client_id, scheme_id, amount, start_date, end_date, frequency, sip_day, status, platform, notes, is_active, stopped_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`;
    
    const values = [s.sip_id, s.client_id, s.scheme_id, s.amount, s.start_date, s.end_date || null, s.frequency, s.sip_day, s.status, s.platform, s.notes, s.is_active, s.stopped_at];
    const result = await pool.query(query, values);
    
    // Get client name for a better log description
    const clientRes = await pool.query('SELECT full_name FROM clients WHERE id = $1', [s.client_id]);
    const clientName = clientRes.rows[0]?.full_name || 'Client';

    // 🕒 New 4-argument Logger
    await logActivity(user, 'CREATE', s.sip_id, `Started new SIP mandate ₹${s.amount} for ${clientName}`);

    res.status(201).json(result.rows[0]);
  } catch (err) { 
    res.status(400).json({ error: err.message }); 
  }
};

export const updateSip = async (req, res) => {
  const { id } = req.params;
  const s = req.body;
  const user = req.user?.username || "System";

  try {
    const query = `
      UPDATE sips SET 
        amount=$1, start_date=$2, end_date=$3, frequency=$4, sip_day=$5, status=$6, platform=$7, notes=$8, is_active=$9
      WHERE id=$10 RETURNING *`;
    
    const values = [s.amount, s.start_date, s.end_date || null, s.frequency, s.sip_day, s.status, s.platform, s.notes, s.is_active, id];
    const result = await pool.query(query, values);
    
    // 🕒 New 4-argument Logger
    await logActivity(user, 'UPDATE', s.sip_id, `Updated parameters for SIP mandate ${s.sip_id}`);
    
    res.json(result.rows[0]);
  } catch (err) { 
    res.status(400).json({ error: err.message }); 
  }
};

export const deleteSip = async (req, res) => {
  const { id } = req.params;
  const user = req.user?.username || "System";

  try {
    const sipData = await pool.query('SELECT sip_id, client_id FROM sips WHERE id = $1', [id]);
    const sipId = sipData.rows[0]?.sip_id || "Unknown";

    await pool.query('DELETE FROM sips WHERE id = $1', [id]);
    
    // 🕒 New 4-argument Logger
    await logActivity(user, 'DELETE', sipId, `Permanently deleted SIP record ${sipId}`);

    res.json({ message: "SIP deleted" });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};s