import { pool } from '../config/db.js';

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
  console.log("📥 CREATE Payload Received:", req.body);
  const { 
    scheme_name, amc_name, category, sub_category, 
    large_cap, mid_cap, small_cap, debt_allocation, gold_allocation,
    commission_rate, total_current_value 
  } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO mf_schemes 
      (scheme_name, amc_name, category, sub_category, large_cap, mid_cap, small_cap, debt_allocation, gold_allocation, commission_rate, total_current_value) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        scheme_name, amc_name, category, sub_category, 
        Number(large_cap || 0), Number(mid_cap || 0), Number(small_cap || 0), 
        Number(debt_allocation || 0), Number(gold_allocation || 0),
        Number(commission_rate || 0.8), Number(total_current_value || 0)
      ]
    );
    console.log("✅ Saved to DB successfully!");
    res.status(201).json(result.rows[0]);
  } catch (err) { 
    console.error("❌ CREATE SQL Error:", err.message);
    res.status(400).json({ error: err.message }); 
  }
};

export const updateScheme = async (req, res) => {
  console.log("📥 UPDATE Payload Received:", req.body);
  const { id } = req.params;
  const { 
    scheme_name, amc_name, category, sub_category, 
    large_cap, mid_cap, small_cap, debt_allocation, gold_allocation,
    commission_rate, total_current_value 
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE mf_schemes SET 
        scheme_name = $1, amc_name = $2, category = $3, sub_category = $4, 
        large_cap = $5, mid_cap = $6, small_cap = $7, debt_allocation = $8, 
        gold_allocation = $9, commission_rate = $10, total_current_value = $11
       WHERE id = $12 RETURNING *`,
      [
        scheme_name, amc_name, category, sub_category, 
        Number(large_cap || 0), Number(mid_cap || 0), Number(small_cap || 0), 
        Number(debt_allocation || 0), Number(gold_allocation || 0),
        Number(commission_rate || 0.8), Number(total_current_value || 0),
        id
      ]
    );
    console.log("✅ Updated in DB successfully!");
    res.json(result.rows[0]);
  } catch (err) { 
    console.error("❌ UPDATE SQL Error:", err.message);
    res.status(400).json({ error: err.message }); 
  }
};

export const deleteScheme = async (req, res) => {
  try {
    await pool.query('DELETE FROM mf_schemes WHERE id = $1', [req.params.id]);
    res.json({ message: "Scheme deleted" });
  } catch (err) { 
    console.error("❌ DELETE Error:", err.message);
    res.status(500).json({ error: err.message }); 
  }
};