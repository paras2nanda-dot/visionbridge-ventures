import { pool } from '../config/db.js';

// --- REPORT 1: CLIENT-WISE AUM ---
export const getClientAumReportData = async () => {
  const query = `
    WITH client_investments AS (
      SELECT 
        c.client_code AS client_id, 
        c.full_name AS client_name,
        sd.name AS sub_distributor_name, -- 🟢 FETCHING PARTNER NAME
        COALESCE(c.monthly_income, 0) AS monthly_income,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, COALESCE(c.dob, c.date_of_birth))) AS age, 
        c.risk_profile,
        COALESCE((SELECT SUM(CASE WHEN LOWER(TRIM(transaction_type)) IN ('purchase', 'switch in', 'switch_in') THEN amount::NUMERIC ELSE -amount::NUMERIC END) FROM transactions WHERE client_id::TEXT = c.id::TEXT), 0) + 
        COALESCE((SELECT SUM(amount::NUMERIC * (EXTRACT(YEAR FROM AGE(CURRENT_DATE, start_date)) * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, start_date)) + 1)) FROM sips WHERE client_id::TEXT = c.id::TEXT AND LOWER(status) = 'active'), 0) AS invested_aum,
        COALESCE((SELECT SUM(amount::NUMERIC) FROM sips WHERE client_id::TEXT = c.id::TEXT AND LOWER(status) = 'active'), 0) AS monthly_active_sip
      FROM clients c
      LEFT JOIN sub_distributors sd ON c.sub_distributor_id = sd.id -- 🟢 LINKING TO PARTNER TABLE
    )
    SELECT 
      client_id,
      client_name,
      sub_distributor_name,
      invested_aum,
      monthly_active_sip,
      monthly_income,
      CASE 
        WHEN monthly_income > 0 THEN ROUND((monthly_active_sip / monthly_income) * 100, 2)
        ELSE 0 
      END AS sip_to_income_ratio,
      age,
      risk_profile
    FROM client_investments
    ORDER BY invested_aum DESC;
  `;
  const result = await pool.query(query);
  return result.rows;
};

// --- REPORT 2: SCHEME-WISE AUM ---
export const getSchemeAumReportData = async () => {
  const query = `
    WITH scheme_stats AS (
      SELECT 
        m.id AS scheme_id,
        m.amc_name,
        m.scheme_name,
        m.category,
        m.sub_category,
        COALESCE(m.commission_rate, 0) AS commission_percentage, 
        (
          SELECT COUNT(DISTINCT client_id) 
          FROM (
            SELECT client_id FROM transactions WHERE scheme_id::TEXT = m.id::TEXT
            UNION
            SELECT client_id FROM sips WHERE scheme_id::TEXT = m.id::TEXT AND LOWER(status) = 'active'
          ) AS unique_clients
        ) AS client_count,
        COALESCE((SELECT SUM(CASE WHEN LOWER(TRIM(transaction_type)) IN ('purchase', 'switch in', 'switch_in') THEN amount::NUMERIC ELSE -amount::NUMERIC END) FROM transactions WHERE scheme_id::TEXT = m.id::TEXT), 0) + 
        COALESCE((SELECT SUM(amount::NUMERIC * (EXTRACT(YEAR FROM AGE(CURRENT_DATE, start_date)) * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, start_date)) + 1)) FROM sips WHERE scheme_id::TEXT = m.id::TEXT AND LOWER(status) = 'active'), 0) AS invested_aum,
        COALESCE((SELECT SUM(amount::NUMERIC) FROM sips WHERE scheme_id::TEXT = m.id::TEXT AND LOWER(status) = 'active'), 0) AS active_sip_book,
        COALESCE(m.total_current_value, 0) AS total_market_value, 
        COALESCE(m.large_cap, 0) AS largecap_pct,
        COALESCE(m.mid_cap, 0) AS midcap_pct,
        COALESCE(m.small_cap, 0) AS smallcap_pct,
        COALESCE(m.debt_allocation, 0) AS debt_pct,
        COALESCE(m.gold_allocation, 0) AS gold_pct
      FROM mf_schemes m
    )
    SELECT * FROM scheme_stats 
    WHERE invested_aum > 0 OR active_sip_book > 0 OR total_market_value > 0
    ORDER BY total_market_value DESC;
  `;
  const result = await pool.query(query);
  return result.rows;
};

// --- REPORT 3: MONTHLY SIP BOOK ---
export const getMonthlySipBookData = async () => {
  const query = `
    SELECT 
      m.amc_name,
      m.scheme_name,
      COUNT(s.id) AS active_sip_count,
      COALESCE(SUM(s.amount::NUMERIC), 0) AS active_sip_amount
    FROM mf_schemes m
    JOIN sips s ON m.id::TEXT = s.scheme_id::TEXT
    WHERE LOWER(s.status) = 'active' 
    GROUP BY m.amc_name, m.scheme_name
    HAVING COUNT(s.id) > 0
    ORDER BY active_sip_amount DESC;
  `;
  const result = await pool.query(query);
  return result.rows;
};

// --- REPORT 4: MONTHLY COMMISSION REPORT ---
export const getMonthlyCommissionData = async () => {
  const query = `
    WITH scheme_data AS (
      SELECT 
        m.amc_name,
        m.scheme_name,
        COALESCE(m.commission_rate, 0) AS commission_pct,
        COALESCE(m.total_current_value, 0) AS total_market_value,
        COALESCE((SELECT SUM(CASE WHEN LOWER(TRIM(transaction_type)) IN ('purchase', 'switch in', 'switch_in') THEN amount::NUMERIC ELSE -amount::NUMERIC END) FROM transactions WHERE scheme_id::TEXT = m.id::TEXT), 0) + 
        COALESCE((SELECT SUM(amount::NUMERIC * (EXTRACT(YEAR FROM AGE(CURRENT_DATE, start_date)) * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, start_date)) + 1)) FROM sips WHERE scheme_id::TEXT = m.id::TEXT AND LOWER(status) = 'active'), 0) AS invested_aum
      FROM mf_schemes m
    )
    SELECT 
      amc_name,
      scheme_name,
      invested_aum,
      total_market_value,
      commission_pct,
      ROUND((invested_aum * (commission_pct / 100)) / 12, 2) AS monthly_comm_invested,
      ROUND((total_market_value * (commission_pct / 100)) / 12, 2) AS monthly_comm_market
    FROM scheme_data
    WHERE invested_aum > 0 OR total_market_value > 0
    ORDER BY monthly_comm_market DESC;
  `;
  const result = await pool.query(query);
  return result.rows;
};

// --- REPORT 5: FULL CLIENTS DATABASE ---
export const getFullClientsDatabaseData = async () => {
  const query = `
    SELECT 
      c.client_code AS formatted_id,
      c.full_name,
      sd.name AS sub_distributor_name, -- 🟢 FETCHING PARTNER NAME
      TO_CHAR(COALESCE(c.dob, c.date_of_birth), 'DD-MM-YYYY') AS dob_display,
      TO_CHAR(c.onboarding_date, 'DD-MM-YYYY') AS onboarding_display,
      c.added_by,
      c.mobile_number,
      COALESCE(c.client_sourcing, c.sourcing) AS sourcing_display, 
      c.sourcing_type,
      c.external_source_name, 
      c.monthly_income,
      c.investment_experience,
      c.risk_profile,
      c.pan,
      c.aadhaar,
      c.email,
      c.nominee_name,
      c.nominee_relation,
      c.nominee_mobile,
      c.notes AS client_notes
    FROM clients c
    LEFT JOIN sub_distributors sd ON c.sub_distributor_id = sd.id -- 🟢 LINKING TO PARTNER TABLE
    ORDER BY c.client_code ASC;
  `;
  const result = await pool.query(query);
  return result.rows;
};

// --- REPORT 6: MF SCHEME DATABASE ---
export const getFullSchemeDatabaseData = async () => {
  const query = `
    SELECT 
      amc_name,
      scheme_name,
      category,
      sub_category,
      commission_rate,
      total_current_value,
      large_cap,
      mid_cap,
      small_cap,
      debt_allocation,
      gold_allocation
    FROM mf_schemes
    ORDER BY amc_name ASC, scheme_name ASC;
  `;
  const result = await pool.query(query);
  return result.rows;
};

// --- NEW: PARTNER-SPECIFIC CLIENT REPORT DATA ---
export const getPartnerClientReportData = async (partnerId) => {
  const query = `
    SELECT
      c.full_name,
      c.client_code,
      c.mobile_number,
      m.scheme_name,
      COALESCE((
        SELECT SUM(CASE 
          WHEN LOWER(TRIM(transaction_type)) IN ('purchase', 'switch in', 'switch_in') THEN amount::NUMERIC 
          WHEN LOWER(TRIM(transaction_type)) IN ('redemption', 'switch out', 'switch_out') THEN -amount::NUMERIC 
          ELSE 0 END) 
        FROM transactions WHERE client_id::TEXT = c.id::TEXT AND scheme_id::TEXT = m.id::TEXT
      ), 0) AS invested_aum,
      COALESCE((
        SELECT SUM(amount::NUMERIC) 
        FROM sips 
        WHERE client_id::TEXT = c.id::TEXT AND scheme_id::TEXT = m.id::TEXT AND LOWER(status) = 'active'
      ), 0) AS monthly_sip,
      TO_CHAR(c.onboarding_date, 'DD-MM-YYYY') AS onboarding_date
    FROM clients c
    CROSS JOIN mf_schemes m
    WHERE c.sub_distributor_id = $1
    AND (
      EXISTS (SELECT 1 FROM transactions WHERE client_id::TEXT = c.id::TEXT AND scheme_id::TEXT = m.id::TEXT)
      OR EXISTS (SELECT 1 FROM sips WHERE client_id::TEXT = c.id::TEXT AND scheme_id::TEXT = m.id::TEXT AND LOWER(status) = 'active')
    )
    ORDER BY c.full_name ASC;
  `;
  const result = await pool.query(query, [partnerId]);
  return result.rows;
};