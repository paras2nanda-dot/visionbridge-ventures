/* eslint-disable no-unused-vars */
import { pool } from "../config/db.js";

/**
 * 🆔 ROBUST ID GENERATOR
 * Finds the maximum numeric value currently in the database 
 * to ensure C001 -> C002 transition is always unique.
 */
const generateClientId = async () => {
  const { rows } = await pool.query(
    "SELECT client_code FROM clients WHERE client_code ~ '^C[0-9]+$' ORDER BY client_code DESC LIMIT 1"
  );
  
  if (rows.length === 0) return "C001";
  
  const lastCode = rows[0].client_code;
  const lastNum = parseInt(lastCode.replace("C", ""), 10);
  return `C${String(lastNum + 1).padStart(3, "0")}`;
};

/**
 * 📋 FETCH ALL ACTIVE CLIENTS
 */
export const fetchClients = async () => {
  const { rows } = await pool.query(`
    SELECT *, 
    CASE 
      WHEN age < 25 THEN 'Below 25'
      WHEN age BETWEEN 25 AND 40 THEN '25-40'
      WHEN age BETWEEN 40 AND 60 THEN '40-60'
      ELSE 'Above 60'
    END as age_bucket
    FROM clients
    WHERE is_active = true
    ORDER BY created_at DESC
  `);
  return rows;
};

/**
 * ➕ CREATE NEW CLIENT
 */
export const createClient = async (data) => {
  const client_code = await generateClientId();
  const {
    full_name, date_of_birth, created_at, added_by, 
    sourcing, sub_distributor_id, sourcing_type, mobile_number, monthly_income,
    risk_profile, investment_experience, pan, aadhaar,
    nominee_name, nominee_relation, nominee_mobile, notes, email
  } = data;

  if (!full_name || !mobile_number) {
    throw new Error("Mandatory fields (Name and Mobile) are missing.");
  }

  // 🧠 Precision Age Calculation
  const dob = new Date(date_of_birth);
  const age = date_of_birth 
    ? Math.floor((new Date() - dob) / 31557600000) 
    : null;

  const { rows } = await pool.query(
    `INSERT INTO clients 
    (client_code, full_name, date_of_birth, age, created_at, added_by, 
     sourcing, sub_distributor_id, sourcing_type, mobile_number, monthly_income, risk_profile, 
     investment_experience, pan, aadhaar, nominee_name, nominee_relation, 
     nominee_mobile, notes, email, is_active)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20, true)
    RETURNING *`,
    [
      client_code, full_name, date_of_birth, age, created_at || new Date(), 
      added_by || 'System', sourcing || 'Internal', sub_distributor_id || null, 
      sourcing_type, mobile_number, monthly_income || 0,
      risk_profile || 'Moderate', investment_experience || 'Beginner', 
      pan, aadhaar, nominee_name, nominee_relation, nominee_mobile, notes, email
    ]
  );
  return rows[0];
};

/**
 * 📝 UPDATE CLIENT DETAILS
 */
export const updateClient = async (id, data) => {
  const { 
    full_name, mobile_number, risk_profile, monthly_income, 
    investment_experience, nominee_name, nominee_relation, 
    nominee_mobile, notes, email, pan, aadhaar
  } = data;

  const { rows } = await pool.query(
    `UPDATE clients 
     SET full_name=$1, mobile_number=$2, risk_profile=$3, monthly_income=$4,
         investment_experience=$5, nominee_name=$6, nominee_relation=$7,
         nominee_mobile=$8, notes=$9, email=$10, pan=$11, aadhaar=$12
     WHERE id=$13 RETURNING *`,
    [
        full_name, mobile_number, risk_profile, monthly_income, 
        investment_experience, nominee_name, nominee_relation, 
        nominee_mobile, notes, email, pan, aadhaar, id
    ]
  );
  
  if (rows.length === 0) throw new Error("Client not found.");
  return rows[0];
};

/**
 * 🗑️ SOFT DELETE (With Safety Check)
 */
export const softDeleteClient = async (id) => {
  // Prevent deletion if financial history exists to maintain ledger integrity
  const sip = await pool.query("SELECT 1 FROM sips WHERE client_id::TEXT=$1 LIMIT 1", [id]);
  const tx = await pool.query("SELECT 1 FROM transactions WHERE client_id::TEXT=$1 LIMIT 1", [id]);

  if (sip.rowCount > 0 || tx.rowCount > 0) {
    throw new Error("Cannot delete client with active SIPs or Transaction history. Deactivate mandates first.");
  }

  await pool.query("UPDATE clients SET is_active=false WHERE id=$1", [id]);
  return { success: true, message: "Client record deactivated." };
};