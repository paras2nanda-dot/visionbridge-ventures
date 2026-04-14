import { pool } from '../config/db.js';
import { logActivity } from './activityController.js';

// Helper function to swap IDs for Names in SIP snapshots
const enhanceSipSnapshotWithNames = async (snapshot) => {
  if (!snapshot) return null;
  const enhanced = { ...snapshot };

  if (enhanced.client_id) {
    const clientRes = await pool.query('SELECT full_name FROM clients WHERE id::TEXT = $1::TEXT', [enhanced.client_id]);
    enhanced.client_name = clientRes.rows[0]?.full_name || enhanced.client_id;
    delete enhanced.client_id; // Hide raw ID from the diff
  }

  if (enhanced.scheme_id) {
    const schemeRes = await pool.query('SELECT scheme_name FROM mf_schemes WHERE id::TEXT = $1::TEXT', [enhanced.scheme_id]);
    enhanced.scheme_name = schemeRes.rows[0]?.scheme_name || enhanced.scheme_id;
    delete enhanced.scheme_id; // Hide raw ID from the diff
  }

  return enhanced;
};

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

  if (!s.client_id || !s.scheme_id) return res.status(400).json({ error: "ID required" });

  try {
    const query = `INSERT INTO sips (sip_id, client_id, scheme_id, amount, start_date, end_date, frequency, sip_day, status, platform, notes, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`;
    const values = [s.sip_id, s.client_id, s.scheme_id, s.amount, s.start_date, s.end_date || null, s.frequency, parseInt(s.sip_day) || 1, s.status, s.platform, s.notes, s.status === 'Active'];
    const result = await pool.query(query, values);
    const newSip = result.rows[0];

    // Enhance the snapshot to swap IDs for Names
    const enhancedNewSip = await enhanceSipSnapshotWithNames(newSip);

    // Forensic Log: Capture the full enhanced object
    await logActivity(
        user, 
        'CREATE', 
        enhancedNewSip.client_name, 
        `📈 Started New SIP Mandate (${s.sip_id}).`,
        null, 
        enhancedNewSip
    );
    
    res.status(201).json(newSip);
  } catch (err) { 
    res.status(400).json({ error: err.message }); 
  }
};

export const updateSip = async (req, res) => {
  const { id } = req.params;
  const s = req.body;
  const user = req.user?.username || "System";
  
  try {
    // 1. Snapshot BEFORE update
    const oldRes = await pool.query('SELECT * FROM sips WHERE id = $1', [id]);
    if (oldRes.rows.length === 0) return res.status(404).json({ error: "Not found" });
    const oldData = oldRes.rows[0];

    const query = `UPDATE sips SET amount=$1, start_date=$2, end_date=$3, frequency=$4, sip_day=$5, status=$6, platform=$7, notes=$8, is_active=$9, scheme_id=$10 WHERE id=$11 RETURNING *`;
    const values = [s.amount, s.start_date, s.end_date || null, s.frequency, parseInt(s.sip_day) || 1, s.status, s.platform, s.notes, s.status === 'Active', s.scheme_id, id];
    
    // 2. Snapshot AFTER update
    const result = await pool.query(query, values);
    const newData = result.rows[0];

    // 💡 ENHANCEMENT: Swap IDs for Names in both snapshots
    const enhancedOldData = await enhanceSipSnapshotWithNames(oldData);
    const enhancedNewData = await enhanceSipSnapshotWithNames(newData);

    // Clean summary title for the Activity Feed
    const detailMsg = `Updated SIP mandate parameters (${newData.sip_id}).`;

    // Forensic Log: Capture both enhanced snapshots
    await logActivity(user, 'UPDATE', enhancedNewData.client_name || 'SIP', detailMsg, enhancedOldData, enhancedNewData);

    res.json(newData);
  } catch (err) { 
    res.status(400).json({ error: err.message }); 
  }
};

export const deleteSip = async (req, res) => {
  const { id } = req.params;
  const user = req.user?.username || "System";
  try {
    // 1. Snapshot BEFORE deletion
    const sipData = await pool.query('SELECT * FROM sips WHERE id = $1', [id]);

    if (sipData.rows.length === 0) return res.status(404).json({ error: "Not found" });
    const deletedRecord = sipData.rows[0];

    await pool.query('DELETE FROM sips WHERE id = $1', [id]);

    // Enhance the snapshot to swap IDs for Names
    const enhancedDeletedRecord = await enhanceSipSnapshotWithNames(deletedRecord);

    // Forensic Log: Pass enhanced deleted record as old_data
    await logActivity(
        user, 
        'DELETE', 
        enhancedDeletedRecord.client_name, 
        `🗑️ Terminated and purged SIP Mandate (${enhancedDeletedRecord.sip_id}).`,
        enhancedDeletedRecord,
        null
    );
    
    res.json({ message: "Deleted" });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

export const bulkDeleteSips = async (req, res) => {
  const { ids } = req.body;
  const user = req.user?.username || "System";
  try {
    const cleanIds = ids.map(id => String(id));
    
    // 1. Snapshot of all records about to be deleted
    const recordsToPurge = await pool.query('SELECT * FROM sips WHERE id::text = ANY($1::text[])', [cleanIds]);
    
    // Enhance all snapshots in the batch
    const enhancedSnapshots = await Promise.all(recordsToPurge.rows.map(enhanceSipSnapshotWithNames));

    await pool.query('DELETE FROM sips WHERE id::text = ANY($1::text[])', [cleanIds]);
    
    // Forensic Log: Store the purged batch
    await logActivity(
        user, 
        'DELETE', 
        'SIP Database', 
        `🚨 Execution of bulk deletion for ${ids.length} SIP records.`,
        { deleted_records: enhancedSnapshots },
        null
    );
    
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Bulk Delete Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};