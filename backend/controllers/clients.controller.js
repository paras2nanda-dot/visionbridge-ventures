import { pool } from '../config/db.js';
import { logActivity } from './activityController.js';

export const getClients = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clients ORDER BY client_code ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createClient = async (req, res) => {
  const c = req.body;
  const username = req.user?.username || "System";
  try {
    const dobValue = c.date_of_birth || c.dob || null;
    
    // 🟢 Added external_source_name to the INSERT query
    const query = `
      INSERT INTO clients (
        client_code, full_name, dob, onboarding_date, added_by, 
        sourcing, sourcing_type, mobile_number, monthly_income, risk_profile, 
        investment_experience, pan, aadhaar, nominee_name, nominee_relation, 
        nominee_mobile, notes, email, external_source_name, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, true) 
      RETURNING *`;
    
    const values = [
      c.client_code, c.full_name, dobValue, c.onboarding_date, c.added_by,
      c.sourcing, c.sourcing_type, c.mobile_number, 
      c.monthly_income ? c.monthly_income.toString().replace(/,/g, '') : null, 
      c.risk_profile, c.investment_experience, c.pan, c.aadhaar, 
      c.nominee_name, c.nominee_relation, c.nominee_mobile, c.notes, c.email,
      c.external_source_name || null // 🟢 Mapping the new field
    ];

    const result = await pool.query(query, values);
    const newClient = result.rows[0];

    await logActivity(
        username, 
        'CREATE', 
        newClient.full_name, 
        `✨ New client record established for ${newClient.full_name} (${newClient.client_code}).`,
        null, 
        newClient
    );

    res.status(201).json(newClient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateClient = async (req, res) => {
  const { id } = req.params;
  const c = req.body;
  const username = req.user?.username || "System";

  try {
    const oldRes = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    if (oldRes.rows.length === 0) return res.status(404).json({ error: "Client not found" });
    const oldData = oldRes.rows[0];

    const dobValue = c.date_of_birth || c.dob || null;
    const cleanIncome = c.monthly_income?.toString().replace(/,/g, '') || null;

    // 🟢 Added external_source_name to the UPDATE query ($19)
    const query = `UPDATE clients SET client_code=$1, full_name=$2, dob=$3, onboarding_date=$4, added_by=$5, sourcing=$6, sourcing_type=$7, mobile_number=$8, monthly_income=$9, risk_profile=$10, investment_experience=$11, pan=$12, aadhaar=$13, nominee_name=$14, nominee_relation=$15, nominee_mobile=$16, notes=$17, email=$18, external_source_name=$19, is_active=true WHERE id=$20 RETURNING *`;
    
    const values = [
      c.client_code, c.full_name, dobValue, c.onboarding_date, c.added_by, 
      c.sourcing, c.sourcing_type, c.mobile_number, cleanIncome, 
      c.risk_profile, c.investment_experience, c.pan, c.aadhaar, 
      c.nominee_name, c.nominee_relation, c.nominee_mobile, c.notes, c.email, 
      c.external_source_name || null, // 🟢 Mapping the new field
      id
    ];
    
    const result = await pool.query(query, values);
    const newData = result.rows[0];

    const detailMsg = `Updated profile information for ${newData.full_name}.`;
    await logActivity(username, 'UPDATE', newData.full_name, detailMsg, oldData, newData);

    res.json(newData);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteClient = async (req, res) => {
  const { id } = req.params;
  const username = req.user?.username || "System";
  try {
    const clientData = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    if (clientData.rows.length === 0) return res.status(404).json({ error: "Not found" });
    const deletedRecord = clientData.rows[0];
    
    await pool.query('DELETE FROM clients WHERE id = $1', [id]);

    await logActivity(
        username, 
        'DELETE', 
        deletedRecord.full_name, 
        `🗑️ Client record for ${deletedRecord.full_name} (${deletedRecord.client_code}) has been permanently purged.`,
        deletedRecord,
        null
    );
    
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const bulkDeleteClients = async (req, res) => {
  const { ids } = req.body;
  const username = req.user?.username || "System";
  try {
    const cleanIds = ids.map(id => String(id));
    const recordsToPurge = await pool.query('SELECT * FROM clients WHERE id::text = ANY($1::text[])', [cleanIds]);
    const snapshots = recordsToPurge.rows;

    await pool.query('DELETE FROM clients WHERE id::text = ANY($1::text[])', [cleanIds]);
    
    await logActivity(
        username, 
        'DELETE', 
        'Clients', 
        `🚨 Execution of bulk deletion for ${ids.length} client records.`,
        { deleted_records: snapshots },
        null
    );

    res.json({ message: "Success" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};