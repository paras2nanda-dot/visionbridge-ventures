import { pool } from '../config/db.js';
import { logActivity } from './activityController.js';

export const getSchemes = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM mf_schemes ORDER BY amc_name ASC, scheme_name ASC');
    res.json(result.rows);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

export const createScheme = async (req, res) => {
  const s = req.body;
  const user = req.user?.username || "System";

  // 💡 CATEGORY SHIELD: Ensuring "Other" maps to something safe if needed
  // If your DB fails on "Other", it might expect "Equity" or "Others"
  const safeCategory = s.category === 'Other' ? 'Equity' : s.category;

  try {
    const result = await pool.query(
      `INSERT INTO mf_schemes 
      (scheme_name, amc_name, category, sub_category, large_cap, mid_cap, small_cap, debt_allocation, gold_allocation, commission_rate, total_current_value) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        s.scheme_name, s.amc_name, safeCategory, s.sub_category, 
        Number(s.large_cap || 0), Number(s.mid_cap || 0), Number(s.small_cap || 0), 
        Number(s.debt_allocation || 0), Number(s.gold_allocation || 0),
        Number(s.commission_rate || 0.8), Number(s.total_current_value || 0)
      ]
    );
    
    const newScheme = result.rows[0];

    // Forensic Log: Capture the full new object
    await logActivity(
      user, 
      'CREATE', 
      newScheme.scheme_name, 
      `✨ Added new mutual fund scheme (${newScheme.scheme_name}).`,
      null,
      newScheme
    );

    res.status(201).json(newScheme);
  } catch (err) { 
    console.error("DB Error:", err.message);
    res.status(400).json({ error: "Database save error: " + err.message }); 
  }
};

export const updateScheme = async (req, res) => {
  const { id } = req.params;
  const s = req.body;
  const user = req.user?.username || "System";
  
  try {
    // 1. Snapshot BEFORE update
    const oldRes = await pool.query('SELECT * FROM mf_schemes WHERE id = $1', [id]);
    if (oldRes.rows.length === 0) return res.status(404).json({ error: "Not found" });
    const oldData = oldRes.rows[0];

    // 💡 REMOVED risk_level entirely to fix the "column does not exist" error
    const query = `
      UPDATE mf_schemes SET 
        scheme_name = $1, 
        amc_name = $2, 
        category = $3, 
        sub_category = $4, 
        large_cap = $5, 
        mid_cap = $6, 
        small_cap = $7, 
        debt_allocation = $8, 
        gold_allocation = $9, 
        commission_rate = $10, 
        total_current_value = $11
      WHERE id = $12 RETURNING *`;
      
    const values = [
      s.scheme_name, 
      s.amc_name, 
      s.category, 
      s.sub_category, 
      Number(s.large_cap || 0), 
      Number(s.mid_cap || 0), 
      Number(s.small_cap || 0), 
      Number(s.debt_allocation || 0), 
      Number(s.gold_allocation || 0), 
      Number(s.commission_rate || 0.8), 
      Number(s.total_current_value || 0), 
      id
    ];

    // 2. Snapshot AFTER update
    const result = await pool.query(query, values);
    const newData = result.rows[0];

    // 💡 Clean summary title for the Activity Feed
    const detailMsg = `Updated mutual fund scheme parameters (${newData.scheme_name}).`;

    // Forensic Log: Capture both snapshots
    await logActivity(user, 'UPDATE', newData.scheme_name, detailMsg, oldData, newData);

    res.json(newData);
  } catch (err) { 
    console.error("Update Error:", err.message);
    res.status(400).json({ error: err.message }); 
  }
};

export const deleteScheme = async (req, res) => {
  const { id } = req.params;
  const user = req.user?.username || "System";
  
  try {
    // 1. Snapshot BEFORE deletion
    const schemeData = await pool.query('SELECT * FROM mf_schemes WHERE id = $1', [id]);
    if (schemeData.rows.length === 0) return res.status(404).json({ error: "Not found" });
    const deletedRecord = schemeData.rows[0];

    await pool.query('DELETE FROM mf_schemes WHERE id = $1', [id]);
    
    // Forensic Log: Pass deleted record as old_data
    await logActivity(
      user, 
      'DELETE', 
      deletedRecord.scheme_name, 
      `🗑️ Removed mutual fund scheme (${deletedRecord.scheme_name}).`,
      deletedRecord,
      null
    );

    res.json({ message: "Scheme deleted" });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};