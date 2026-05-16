/* eslint-disable no-unused-vars */
import { pool } from "../config/db.js";

/**
 * 📋 FETCH ALL TRANSACTIONS
 * Joins with Clients and Schemes to provide human-readable names for the UI.
 */
export const fetchTransactions = async () => {
  const query = `
    SELECT 
      t.*, 
      c.full_name as client_name, 
      c.client_code,
      m.scheme_name,
      TO_CHAR(t.transaction_date, 'YYYY-MM-DD') as date_display
    FROM transactions t
    JOIN clients c ON t.client_id::TEXT = c.id::TEXT
    JOIN mf_schemes m ON t.scheme_id::TEXT = m.id::TEXT
    ORDER BY t.transaction_date DESC, t.created_at DESC
  `;
  const { rows } = await pool.query(query);
  return rows;
};

/**
 * ➕ CREATE TRANSACTION
 * Supports Purchase, Redemption, Switch In, Switch Out, and SIP Missed.
 */
export const createTransaction = async (data) => {
  const {
    client_id,
    scheme_id,
    transaction_type,
    amount,
    transaction_date,
    reference_number,
    notes
  } = data;

  if (!client_id || !scheme_id || !amount || !transaction_type) {
    throw new Error("Missing required financial parameters.");
  }

  const query = `
    INSERT INTO transactions 
    (client_id, scheme_id, transaction_type, amount, transaction_date, reference_number, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    client_id,
    scheme_id,
    transaction_type, // Purchase, Redemption, Switch In, Switch Out, SIP Missed, etc.
    parseFloat(amount),
    transaction_date || new Date(),
    reference_number || null,
    notes || ""
  ]);

  return rows[0];
};

/**
 * 📝 UPDATE TRANSACTION
 */
export const updateTransaction = async (id, data) => {
  const { amount, transaction_type, transaction_date, notes, reference_number } = data;

  const query = `
    UPDATE transactions 
    SET amount = $1, 
        transaction_type = $2, 
        transaction_date = $3, 
        notes = $4,
        reference_number = $5
    WHERE id = $6
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    parseFloat(amount),
    transaction_type,
    transaction_date,
    notes,
    reference_number,
    id
  ]);

  if (rows.length === 0) throw new Error("Transaction record not found.");
  return rows[0];
};

/**
 * 🗑️ DELETE TRANSACTION
 */
export const deleteTransaction = async (id) => {
  const result = await pool.query("DELETE FROM transactions WHERE id = $1 RETURNING *", [id]);
  if (result.rowCount === 0) throw new Error("Transaction not found.");
  return { success: true };
};

/**
 * 🚨 BULK DELETE
 */
export const bulkDeleteTransactions = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) throw new Error("No IDs provided.");
  await pool.query("DELETE FROM transactions WHERE id = ANY($1)", [ids]);
  return { success: true };
};