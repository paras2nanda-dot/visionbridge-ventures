import express from 'express';
import { getClients, createClient } from '../controllers/clients.controller.js';
import { pool } from '../config/db.js';

const router = express.Router();

router.get('/', getClients);
router.post('/', createClient);

// UPDATE CLIENT
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const c = req.body;
  try {
    const query = `
      UPDATE clients SET 
        full_name=$1, date_of_birth=$2, onboarding_date=$3, added_by=$4, 
        sourcing=$5, sourcing_type=$6, mobile_number=$7, monthly_income=$8, 
        risk_profile=$9, investment_experience=$10, pan=$11, aadhaar=$12, 
        nominee_name=$13, nominee_relation=$14, nominee_mobile=$15, notes=$16, email=$17
      WHERE id=$18 RETURNING *`;
    
    const values = [
      c.full_name, c.date_of_birth, c.onboarding_date, c.added_by,
      c.sourcing, c.sourcing_type, c.mobile_number, 
      c.monthly_income ? c.monthly_income.toString().replace(/,/g, '') : null, 
      c.risk_profile, c.investment_experience, c.pan, c.aadhaar, 
      c.nominee_name, c.nominee_relation, c.nominee_mobile, c.notes, c.email, id
    ];

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE CLIENT
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM clients WHERE id = $1', [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;