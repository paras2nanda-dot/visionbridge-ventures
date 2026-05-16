/* eslint-disable no-unused-vars */
import { pool } from '../config/db.js';

/**
 * ➕ CREATE SIP MANDATE
 * Fixed: Uses 'amount' and 'scheme_id' to match your DB schema.
 */
export const createSip = async (data) => {
  const { 
    sip_id, // e.g., SID00001
    client_id, 
    scheme_id, 
    amount, 
    frequency, 
    sip_day, 
    start_date, 
    end_date 
  } = data;

  if (!client_id || !amount || !scheme_id) {
    throw new Error('Mandatory SIP fields (Client, Scheme, Amount) are missing.');
  }

  // 🛡️ Ensure status is 'Active' to trigger AUM counting in MathService
  const res = await pool.query(
    `INSERT INTO sips 
     (sip_id, client_id, scheme_id, amount, frequency, sip_day, start_date, end_date, is_active, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, 'Active')
     RETURNING *`,
    [sip_id, client_id, scheme_id, amount, frequency || 'Monthly', parseInt(sip_day) || 1, start_date, end_date || null]
  );
  
  return res.rows[0];
};

/**
 * 🔍 FETCH CLIENT SIPs
 * Standardized with the name-join used in your analytics.
 */
export const fetchSipsByClient = async (clientId) => {
  const res = await pool.query(
    `SELECT s.*, m.scheme_name 
     FROM sips s
     JOIN mf_schemes m ON s.scheme_id::TEXT = m.id::TEXT
     WHERE s.client_id::TEXT = $1::TEXT 
     ORDER BY s.start_date DESC`,
    [clientId]
  );
  return res.rows;
};

/**
 * 🛑 STOP SIP MANDATE
 * Fixed: Synchronizes both status string and is_active boolean.
 * This ensures the MathService stops adding future installments immediately.
 */
export const stopSip = async (id) => {
  const res = await pool.query(
    `UPDATE sips 
     SET is_active = false, 
         status = 'Stopped'
     WHERE id = $1 
     RETURNING *`,
    [id]
  );
  
  if (res.rowCount === 0) throw new Error("SIP record not found.");
  return res.rows[0];
};