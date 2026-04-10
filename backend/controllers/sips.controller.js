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
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const createSip = async (req, res) => {
  const { sip_id, client_id, scheme_id, amount, start_date, end_date, frequency, sip_day, status, platform, notes, is_active, stopped_at } = req.body;
  try {
    const query = `
      INSERT INTO sips (sip_id, client_id, scheme_id, amount, start_date, end_date, frequency, sip_day, status, platform, notes, is_active, stopped_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`;
    const result = await pool.query(query, [sip_id, client_id, scheme_id, amount, start_date, end_date || null, frequency, sip_day, status, platform, notes, is_active, stopped_at]);
    
    // Log Activity
    const clientNameRes = await pool.query('SELECT full_name FROM clients WHERE id = $1', [client_id]);
    const clientName = clientNameRes.rows[0]?.full_name || 'Client';
    await logActivity('sip', 'SIP Mandate Active', `₹${new Intl.NumberFormat('en-IN').format(amount)} monthly SIP started for ${clientName}.`);

    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

export const updateSip = async (req, res) => {
  const { id } = req.params;
  const { client_id, scheme_id, amount, start_date, end_date, frequency, sip_day, status, platform, notes, is_active, stopped_at } = req.body;
  try {
    const query = `
      UPDATE sips SET 
        client_id=$1, scheme_id=$2, amount=$3, start_date=$4, end_date=$5, frequency=$6, sip_day=$7, status=$8, platform=$9, notes=$10, is_active=$11, stopped_at=$12
      WHERE id=$13 RETURNING *`;
    const result = await pool.query(query, [client_id, scheme_id, amount, start_date, end_date || null, frequency, sip_day, status, platform, notes, is_active, stopped_at, id]);
    
    await logActivity('sip', 'SIP Modified', `SIP parameters for the client were updated.`);
    
    res.json(result.rows[0]);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

export const deleteSip = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM sips WHERE id = $1', [id]);
    await logActivity('sip', 'SIP Removed', `An active SIP record was deleted.`);
    res.json({ message: "SIP deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};