import { pool } from '../config/db.js';
import { logActivity } from './activityController.js';

export const getSchemes = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM mf_schemes ORDER BY amc_name ASC, scheme_name ASC');
    res.json(result.rows);
  } catch (err) { 
    console.error("❌ GET Error:", err.message);
    res.status(500).json({ error: err.message }); 
  }
};

export const createScheme = async (req, res) => {
  const s = req.body;
  const user = req.user?.username || "System";
  
  try {
    const result = await pool.query(
      `INSERT INTO mf_schemes 
      (scheme_name, amc_name, category, sub_category, large_cap, mid_cap, small_cap, debt_allocation, gold_allocation, commission_rate, total_current_value) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        s.scheme_name, s.amc_name, s.category, s.sub_category, 
        Number(s.large_cap || 0), Number(s.mid_cap || 0), Number(s.small_cap || 0), 
        Number(s.debt_allocation || 0), Number(s.gold_allocation || 0),
        Number(s.commission_rate || 0.8), Number(s.total_current_value || 0)
      ]
    );

    await logActivity(user, 'CREATE', s.scheme_name, `Added new Mutual Fund scheme: ${s.scheme_name}`);

    res.status(201).json(result.rows[0]);
  } catch (err) { 
    res.status(400).json({ error: err.message }); 
  }
};

export const updateScheme = async (req, res) => {
  const { id } = req.params;
  const s = req.body;
  const user = req.user?.username || "System";

  try {
    const result = await pool.query(
      `UPDATE mf_schemes SET 
        scheme_name = $1, amc_name = $2, category = $3, sub_category = $4, 
        large_cap = $5, mid_cap = $6, small_cap = $7, debt_allocation = $8, 
        gold_allocation = $9, commission_rate = $10, total_current_value = $11
       WHERE id = $12 RETURNING *`,
      [
        s.scheme_name, s.amc_name, s.category, s.sub_category, 
        Number(s.large_cap || 0), Number(s.mid_cap || 0), Number(s.small_cap || 0), 
        Number(s.debt_allocation || 0), Number(s.gold_allocation || 0),
        Number(s.commission_rate || 0.8), Number(s.total_current_value || 0),
        id
      ]
    );

    await logActivity(user, 'UPDATE', s.scheme_name, `Updated details for ${s.scheme_name}`);

    res.json(result.rows[0]);
  } catch (err) { 
    res.status(400).json({ error: err.message }); 
  }
};

export const deleteScheme = async (req, res) => {
  const { id } = req.params;
  const user = req.user?.username || "System";
  try {
    const schemeData = await pool.query('SELECT scheme_name FROM mf_schemes WHERE id = $1', [id]);
    const schemeName = schemeData.rows[0]?.scheme_name || "Scheme";

    await pool.query('DELETE FROM mf_schemes WHERE id = $1', [id]);

    await logActivity(user, 'DELETE', schemeName, `Removed ${schemeName} from the master list`);

    res.json({ message: "Scheme deleted" });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};