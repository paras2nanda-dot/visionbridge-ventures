import pool from '../config/db.js';

export const createSip = async (data) => {
  const { client_id, scheme_name, sip_amount, frequency, sip_day, start_date, end_date } = data;

  if (!client_id || !sip_amount || !scheme_name) {
    throw new Error('Mandatory SIP fields missing');
  }

  const res = await pool.query(
    `INSERT INTO sips 
     (client_id, scheme_name, sip_amount, frequency, sip_day, start_date, end_date, is_active, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true, 'ACTIVE')
     RETURNING *`,
    [client_id, scheme_name, sip_amount, frequency, sip_day, start_date, end_date]
  );
  return res.rows[0];
};

export const fetchSipsByClient = async (clientId) => {
  const res = await pool.query(
    `SELECT * FROM sips WHERE client_id = $1 ORDER BY start_date DESC`,
    [clientId]
  );
  return res.rows;
};

export const stopSip = async (id) => {
  const res = await pool.query(
    `UPDATE sips SET is_active = false, status = 'STOPPED', stopped_at = CURRENT_DATE 
     WHERE id = $1 RETURNING *`,
    [id]
  );
  return res.rows[0];
};