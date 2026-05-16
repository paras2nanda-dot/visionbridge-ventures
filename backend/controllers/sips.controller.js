/* eslint-disable no-unused-vars */
import { pool } from '../config/db.js';
import { logActivity } from './activityController.js';

/**
 * 🔍 ENHANCEMENT HELPER
 * Swaps raw UUIDs/IDs for Names in activity logs to make your 
 * audit trail readable for humans.
 */
const enhanceSipSnapshotWithNames = async (snapshot) => {
  if (!snapshot) return null;
  const enhanced = { ...snapshot };

  try {
    if (enhanced.client_id) {
      const clientRes = await pool.query('SELECT full_name FROM clients WHERE id::TEXT = $1::TEXT', [enhanced.client_id]);
      enhanced.client_name = clientRes.rows[0]?.full_name || enhanced.client_id;
      delete enhanced.client_id; 
    }

    if (enhanced.scheme_id) {
      const schemeRes = await pool.query('SELECT scheme_name FROM mf_schemes WHERE id::TEXT = $1::TEXT', [enhanced.scheme_id]);
      enhanced.scheme_name = schemeRes.rows[0]?.scheme_name || enhanced.scheme_id;
      delete enhanced.scheme_id;
    }
  } catch (err) {
    console.error("Log Enhancement Error:", err.message);
  }

  return enhanced;
};

/**
 * 📈 FETCH ALL SIPs
 */
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
    
    // Standardized Response Format
    res.json({ success: true, data: result.rows });
  } catch (err) { 
    res.status(500).json({ success: false, error: err.message }); 
  }
};

/**
 * ➕ CREATE NEW SIP MANDATE
 */
export const createSip = async (req, res) => {
  const s = req.body;
  const user = req.user?.username || "System"; 

  if (!s.client_id || !s.scheme_id) {
    return res.status(400).json({ success: false, error: "Client and Scheme IDs are required." });
  }

  try {
    // Synchronize is_active with status for the Math Engine
    const isActive = s.status?.toLowerCase() === 'active';

    const query = `
      INSERT INTO sips 
      (sip_id, client_id, scheme_id, amount, start_date, end_date, frequency, sip_day, status, platform, notes, is_active) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`;
    
    const values = [
        s.sip_id, s.client_id, s.scheme_id, s.amount, s.start_date, s.end_date || null, 
        s.frequency || 'Monthly', parseInt(s.sip_day) || 1, s.status, s.platform, s.notes, isActive
    ];
    
    const result = await pool.query(query, values);
    const newSip = result.rows[0];

    const enhancedNewSip = await enhanceSipSnapshotWithNames(newSip);

    await logActivity(
        user, 
        'CREATE', 
        enhancedNewSip.client_name, 
        `📈 Started New SIP Mandate (${s.sip_id}) for ${enhancedNewSip.scheme_name}.`,
        null, 
        enhancedNewSip
    );
    
    res.status(201).json({ success: true, data: newSip });
  } catch (err) { 
    res.status(400).json({ success: false, error: err.message }); 
  }
};

/**
 * 📝 UPDATE SIP PARAMETERS
 */
export const updateSip = async (req, res) => {
  const { id } = req.params;
  const s = req.body;
  const user = req.user?.username || "System";
  
  try {
    const oldRes = await pool.query('SELECT * FROM sips WHERE id = $1', [id]);
    if (oldRes.rows.length === 0) return res.status(404).json({ success: false, error: "SIP Record not found." });
    const oldData = oldRes.rows[0];

    const isActive = s.status?.toLowerCase() === 'active';

    const query = `
      UPDATE sips 
      SET amount=$1, start_date=$2, end_date=$3, frequency=$4, sip_day=$5, 
          status=$6, platform=$7, notes=$8, is_active=$9, scheme_id=$10 
      WHERE id=$11 RETURNING *`;
    
    const values = [
        s.amount, s.start_date, s.end_date || null, s.frequency, parseInt(s.sip_day) || 1, 
        s.status, s.platform, s.notes, isActive, s.scheme_id, id
    ];
    
    const result = await pool.query(query, values);
    const newData = result.rows[0];

    const enhancedOldData = await enhanceSipSnapshotWithNames(oldData);
    const enhancedNewData = await enhanceSipSnapshotWithNames(newData);

    await logActivity(
        user, 
        'UPDATE', 
        enhancedNewData.client_name, 
        `📝 Modified SIP mandate (${newData.sip_id}). Status changed to: ${newData.status}.`, 
        enhancedOldData, 
        enhancedNewData
    );

    res.json({ success: true, data: newData });
  } catch (err) { 
    res.status(400).json({ success: false, error: err.message }); 
  }
};

/**
 * 🗑️ DELETE SINGLE SIP
 */
export const deleteSip = async (req, res) => {
  const { id } = req.params;
  const user = req.user?.username || "System";
  try {
    const sipData = await pool.query('SELECT * FROM sips WHERE id = $1', [id]);
    if (sipData.rows.length === 0) return res.status(404).json({ success: false, error: "Not found." });
    const deletedRecord = sipData.rows[0];

    await pool.query('DELETE FROM sips WHERE id = $1', [id]);

    const enhancedDeletedRecord = await enhanceSipSnapshotWithNames(deletedRecord);

    await logActivity(
        user, 
        'DELETE', 
        enhancedDeletedRecord.client_name, 
        `🗑️ Terminated and purged SIP Mandate (${enhancedDeletedRecord.sip_id}).`,
        enhancedDeletedRecord,
        null
    );
    
    res.json({ success: true, message: "Deleted" });
  } catch (err) { 
    res.status(500).json({ success: false, error: err.message }); 
  }
};

/**
 * 🚨 BULK DELETE SIPs
 */
export const bulkDeleteSips = async (req, res) => {
  const { ids } = req.body;
  const user = req.user?.username || "System";
  try {
    const cleanIds = ids.map(id => String(id));
    const recordsToPurge = await pool.query('SELECT * FROM sips WHERE id::text = ANY($1::text[])', [cleanIds]);
    const enhancedSnapshots = await Promise.all(recordsToPurge.rows.map(enhanceSipSnapshotWithNames));

    await pool.query('DELETE FROM sips WHERE id::text = ANY($1::text[])', [cleanIds]);
    
    await logActivity(
        user, 
        'DELETE', 
        'SIP Database', 
        `🚨 Execution of bulk deletion for ${ids.length} SIP records.`,
        { deleted_records: enhancedSnapshots },
        null
    );
    
    res.json({ success: true, message: "Batch Deleted Successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};