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

  if (!s.client_id || !s.scheme_id) return res.status(400).json({ error: "ID required" });

  try {
    const query = `INSERT INTO sips (sip_id, client_id, scheme_id, amount, start_date, end_date, frequency, sip_day, status, platform, notes, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`;
    const values = [s.sip_id, s.client_id, s.scheme_id, s.amount, s.start_date, s.end_date || null, s.frequency, parseInt(s.sip_day) || 1, s.status, s.platform, s.notes, s.status === 'Active'];
    const result = await pool.query(query, values);
    const newSip = result.rows[0];

    // Fetch client name for the log title
    const clientRes = await pool.query('SELECT full_name FROM clients WHERE id::TEXT = $1::TEXT', [s.client_id]);
    const clientName = clientRes.rows[0]?.full_name || 'Client';

    // Forensic Log: Capture the full new object
    await logActivity(
        user, 
        'CREATE', 
        clientName, 
        `📈 Started New SIP Mandate (${s.sip_id}).`,
        null, 
        newSip
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

    // 💡 Clean summary title for the Activity Feed
    const detailMsg = `Updated SIP mandate parameters (${newData.sip_id}).`;

    // Forensic Log: Capture both snapshots
    await logActivity(user, 'UPDATE', s.client_name || 'SIP', detailMsg, oldData, newData);

    res.json(newData);
  } catch (err) { 
    res.status(400).json({ error: err.message }); 
  }
};

export const deleteSip = async (req, res) => {
  const { id } = req.params;
  const user = req.user?.username || "System";
  try {
    // 1. Snapshot BEFORE deletion (grabbing all data + client name)
    const sipData = await pool.query(`
        SELECT s.*, c.full_name as client_name 
        FROM sips s 
        JOIN clients c ON s.client_id::TEXT = c.id::TEXT 
        WHERE s.id = $1`, [id]);

    if (sipData.rows.length === 0) return res.status(404).json({ error: "Not found" });
    const deletedRecord = sipData.rows[0];

    await pool.query('DELETE FROM sips WHERE id = $1', [id]);

    // Forensic Log: Pass deleted record as old_data
    await logActivity(
        user, 
        'DELETE', 
        deletedRecord.client_name, 
        `🗑️ Terminated and purged SIP Mandate (${deletedRecord.sip_id}).`,
        deletedRecord,
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
    const snapshots = recordsToPurge.rows;

    await pool.query('DELETE FROM sips WHERE id::text = ANY($1::text[])', [cleanIds]);
    
    // Forensic Log: Store the purged batch
    await logActivity(
        user, 
        'DELETE', 
        'SIP Database', 
        `🚨 Execution of bulk deletion for ${ids.length} SIP records.`,
        { deleted_records: snapshots },
        null
    );
    
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Bulk Delete Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};