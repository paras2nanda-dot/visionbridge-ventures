import express from 'express';
import { getSchemes, createScheme } from '../controllers/mfSchemes.controller.js';
import { pool } from '../config/db.js';

const router = express.Router();

router.get('/', getSchemes);
router.post('/', createScheme);

// UPDATE SCHEME
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const s = req.body;
  const user = req.user.username;

  try {
    const query = `
      UPDATE mf_schemes SET 
        scheme_name=$1, category=$2, sub_category=$3, amc_name=$4, risk_level=$5
      WHERE id=$6 RETURNING *`;
    
    const values = [s.scheme_name, s.category, s.sub_category, s.amc_name, s.risk_level, id];
    const result = await pool.query(query, values);

    // 🕒 LOG ACTIVITY
    await pool.query(
      'INSERT INTO activities (user_name, action_type, entity_name, details) VALUES ($1, $2, $3, $4)',
      [user, 'UPDATE', s.scheme_name, `Updated scheme details for ${s.scheme_name}`]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE SCHEME
router.delete('/:id', async (req, res) => {
  const user = req.user.username;
  try {
    const schemeData = await pool.query('SELECT scheme_name FROM mf_schemes WHERE id = $1', [req.params.id]);
    const schemeName = schemeData.rows[0]?.scheme_name || "Unknown Scheme";

    await pool.query('DELETE FROM mf_schemes WHERE id = $1', [req.params.id]);

    // 🕒 LOG ACTIVITY
    await pool.query(
      'INSERT INTO activities (user_name, action_type, entity_name, details) VALUES ($1, $2, $3, $4)',
      [user, 'DELETE', schemeName, `Removed ${schemeName} from available MF Schemes`]
    );

    res.json({ message: "Scheme Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;