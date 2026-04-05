import { pool } from '../config/db.js';

// GET ALL CLIENTS
export const getClients = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clients ORDER BY client_code ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE NEW CLIENT
export const createClient = async (req, res) => {
  const c = req.body;
  try {
    // 💡 Fix: Safely map either 'dob' or 'date_of_birth' from the frontend
    const dobValue = c.dob || c.date_of_birth || null;

    const query = `
      INSERT INTO clients (
        client_code, full_name, dob, onboarding_date, added_by, 
        sourcing, sourcing_type, mobile_number, monthly_income, risk_profile, 
        investment_experience, pan, aadhaar, nominee_name, nominee_relation, 
        nominee_mobile, notes, email, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, true) 
      RETURNING *`;
    
    const values = [
      c.client_code, c.full_name, dobValue, c.onboarding_date, c.added_by,
      c.sourcing, c.sourcing_type, c.mobile_number, 
      c.monthly_income ? c.monthly_income.toString().replace(/,/g, '') : null, 
      c.risk_profile, c.investment_experience, c.pan, c.aadhaar, 
      c.nominee_name, c.nominee_relation, c.nominee_mobile, c.notes, c.email
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// UPDATE EXISTING CLIENT (This fixes your Edit Screen)
export const updateClient = async (req, res) => {
  const { id } = req.params;
  const c = req.body;
  try {
    const dobValue = c.dob || c.date_of_birth || null;
    
    const query = `
      UPDATE clients SET 
        client_code = $1, full_name = $2, dob = $3, onboarding_date = $4, added_by = $5, 
        sourcing = $6, sourcing_type = $7, mobile_number = $8, monthly_income = $9, risk_profile = $10, 
        investment_experience = $11, pan = $12, aadhaar = $13, nominee_name = $14, nominee_relation = $15, 
        nominee_mobile = $16, notes = $17, email = $18, is_active = true
      WHERE id = $19 
      RETURNING *`;
    
    const values = [
      c.client_code, c.full_name, dobValue, c.onboarding_date, c.added_by,
      c.sourcing, c.sourcing_type, c.mobile_number, 
      c.monthly_income ? c.monthly_income.toString().replace(/,/g, '') : null, 
      c.risk_profile, c.investment_experience, c.pan, c.aadhaar, 
      c.nominee_name, c.nominee_relation, c.nominee_mobile, c.notes, c.email,
      id
    ];

    const result = await pool.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Client not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE CLIENT
export const deleteClient = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM clients WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Client not found' });
    res.json({ message: 'Client deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};