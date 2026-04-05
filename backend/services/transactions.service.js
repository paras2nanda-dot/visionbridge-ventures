import pool from "../config/db.js";

const generateClientId = async () => {
  const { rows } = await pool.query("SELECT COUNT(*) FROM clients");
  const next = Number(rows[0].count) + 1;
  return `C${String(next).padStart(3, "0")}`;
};

export const fetchClients = async () => {
  const { rows } = await pool.query(`
    SELECT *, 
    CASE 
      WHEN age < 25 THEN 'Below 25'
      WHEN age BETWEEN 25 AND 30 THEN '25-30'
      WHEN age BETWEEN 30 AND 35 THEN '30-35'
      WHEN age BETWEEN 35 AND 40 THEN '35-40'
      WHEN age BETWEEN 40 AND 50 THEN '40-50'
      WHEN age BETWEEN 50 AND 60 THEN '50-60'
      ELSE 'Above 60'
    END as age_bucket
    FROM clients
    WHERE is_active = true
    ORDER BY created_at DESC
  `);
  return rows;
};

export const createClient = async (data) => {
  const client_code = await generateClientId();
  const {
    full_name, date_of_birth, created_at, client_added_by, 
    client_sourcing, sourcing_type, mobile_number, monthly_income,
    risk_profile, investment_experience, pan, aadhaar,
    nominee_name, nominee_relation, nominee_mobile, client_notes
  } = data;

  if (!full_name || !mobile_number) throw new Error("Mandatory fields missing");

  const age = date_of_birth 
    ? new Date().getFullYear() - new Date(date_of_birth).getFullYear() 
    : null;

  const { rows } = await pool.query(
    `INSERT INTO clients 
    (client_code, full_name, date_of_birth, age, created_at, client_added_by, 
     client_sourcing, sourcing_type, mobile_number, monthly_income, risk_profile, 
     investment_experience, pan, aadhaar, nominee_name, nominee_relation, 
     nominee_mobile, client_notes, is_active)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18, true)
    RETURNING *`,
    [client_code, full_name, date_of_birth, age, created_at || new Date(), 
     client_added_by, client_sourcing, sourcing_type, mobile_number, monthly_income,
     risk_profile, investment_experience, pan, aadhaar, nominee_name, 
     nominee_relation, nominee_mobile, client_notes]
  );
  return rows[0];
};

export const updateClient = async (id, data) => {
  const { 
    full_name, mobile_number, risk_profile, monthly_income, 
    investment_experience, nominee_name, client_notes 
  } = data;

  const { rows } = await pool.query(
    `UPDATE clients 
     SET full_name=$1, mobile_number=$2, risk_profile=$3, monthly_income=$4,
         investment_experience=$5, nominee_name=$6, client_notes=$7
     WHERE id=$8 RETURNING *`,
    [full_name, mobile_number, risk_profile, monthly_income, investment_experience, nominee_name, client_notes, id]
  );
  return rows[0];
};

export const softDeleteClient = async (id) => {
  const sip = await pool.query("SELECT 1 FROM sips WHERE client_id=$1 LIMIT 1", [id]);
  const tx = await pool.query("SELECT 1 FROM transactions WHERE client_id=$1 LIMIT 1", [id]);

  if (sip.rowCount > 0 || tx.rowCount > 0) {
    throw new Error("Cannot delete client with existing SIP or Transactions history.");
  }

  await pool.query("UPDATE clients SET is_active=false WHERE id=$1", [id]);
  return { message: "Client deactivated successfully" };
};