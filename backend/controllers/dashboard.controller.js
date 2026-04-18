import { pool } from '../config/db.js';

// 🛡️ Safe Date Parser Helper
const parseSafeDate = (dateStr) => {
  if (!dateStr || String(dateStr).trim() === "") return null;
  if (dateStr instanceof Date) return dateStr;
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  const parts = String(dateStr).split('-');
  if (parts.length === 3 && parts[2].length === 4) { 
    d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
};

// 🛡️ Safe Age Calculator Helper
const calculateAge = (dobString) => {
  const birthDate = parseSafeDate(dobString);
  if (!birthDate) return "N/A";
  return Math.floor((new Date() - birthDate) / 31557600000);
};

/**
 * 🏢 BUSINESS DASHBOARD LOGIC 
 */
export const getBusinessStats = async (req, res) => {
  try {
    // 1. Basic Counts & SIP Book (Including "Total Active Clients")
    const statsQuery = `
      WITH current_ist AS (
        SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date as today
      ),
      active_clients_pool AS (
        SELECT client_id FROM (
            SELECT client_id, SUM(CASE 
              WHEN LOWER(TRIM(transaction_type)) IN ('purchase', 'switch in', 'switch_in') THEN amount::NUMERIC 
              WHEN LOWER(TRIM(transaction_type)) IN ('redemption', 'switch out', 'switch_out') THEN -amount::NUMERIC 
              ELSE 0 END) as net_inv
            FROM transactions GROUP BY client_id
        ) t WHERE net_inv >= 1
        UNION
        SELECT client_id FROM sips WHERE LOWER(status) = 'active'
      )
      SELECT 
        (SELECT COUNT(*)::INT FROM clients WHERE is_active = true) as total_clients,
        (SELECT COUNT(DISTINCT client_id)::INT FROM active_clients_pool) as total_active_clients,
        (SELECT COUNT(*)::INT FROM clients WHERE onboarding_date >= (SELECT today FROM current_ist) - INTERVAL '30 days') as new_clients_30d,
        (SELECT COALESCE(SUM(amount::NUMERIC), 0) FROM sips WHERE LOWER(status) = 'active') as monthly_sip_book
    `;
    const basicRes = await pool.query(statsQuery);
    const basic = basicRes.rows[0];

    // 2. AUM & Commission Calculations (Cost-Basis vs Market-Value Basis)
    const aumQuery = `
      WITH scheme_calc AS (
        SELECT 
          m.id, 
          m.commission_rate, 
          COALESCE(m.total_current_value, 0) as market_value,
          COALESCE((
            SELECT SUM(CASE 
              WHEN LOWER(TRIM(transaction_type)) IN ('purchase', 'switch in', 'switch_in') THEN amount::NUMERIC 
              WHEN LOWER(TRIM(transaction_type)) IN ('redemption', 'switch out', 'switch_out') THEN -amount::NUMERIC 
              ELSE 0 END) 
            FROM transactions WHERE scheme_id::TEXT = m.id::TEXT
          ), 0) as trans_invested,
          COALESCE((
            SELECT SUM(amount::NUMERIC * (EXTRACT(YEAR FROM AGE((CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'), start_date)) * 12 + EXTRACT(MONTH FROM AGE((CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'), start_date)) + 1)) 
            FROM sips WHERE scheme_id::TEXT = m.id::TEXT AND LOWER(status) = 'active'
          ), 0) as sip_invested
        FROM mf_schemes m
      )
      SELECT 
        COALESCE(SUM(trans_invested + sip_invested), 0) as total_invested_aum,
        COALESCE(SUM(market_value), 0) as market_value_aum,
        -- Commission on Invested (Annualized)
        COALESCE(SUM((trans_invested + sip_invested) * (COALESCE(commission_rate, 0.8) / 100)), 0) as comm_inv_annual,
        -- Commission on Market Value (Annualized)
        COALESCE(SUM(market_value * (COALESCE(commission_rate, 0.8) / 100)), 0) as comm_mkt_annual
      FROM scheme_calc
    `;
    const aumRes = await pool.query(aumQuery);
    const aum = aumRes.rows[0];

    // 3. 🎂 Birthday Logic
    const clientsRes = await pool.query(`
      SELECT full_name, dob, date_of_birth 
      FROM clients 
      WHERE (dob IS NOT NULL AND TRIM(dob::text) != '') 
         OR (date_of_birth IS NOT NULL AND TRIM(date_of_birth::text) != '')
    `);
    
    const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    today.setHours(0, 0, 0, 0);

    let upcomingBirthdays = [];
    clientsRes.rows.forEach(client => {
      const rawDate = client.dob || client.date_of_birth;
      const bday = parseSafeDate(rawDate);
      if (!bday) return;
      let nextBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
      if (nextBday < today) nextBday.setFullYear(today.getFullYear() + 1);
      const daysLeft = Math.ceil((nextBday - today) / (1000 * 60 * 60 * 24));
      if (daysLeft >= 0 && daysLeft <= 7) {
        upcomingBirthdays.push({ full_name: client.full_name, dob: rawDate, days_left: daysLeft });
      }
    });
    upcomingBirthdays.sort((a, b) => a.days_left - b.days_left);

    // 4. 🔔 SIP END ALERTS
    const sipsEndingRes = await pool.query(`
      SELECT c.full_name, m.scheme_name, s.end_date,
        (s.end_date - (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date)::INT as days_left
      FROM sips s
      JOIN clients c ON s.client_id::TEXT = c.id::TEXT
      JOIN mf_schemes m ON s.scheme_id::TEXT = m.id::TEXT
      WHERE LOWER(s.status) = 'active'
        AND s.end_date IS NOT NULL
        AND s.end_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date
        AND s.end_date <= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date + INTERVAL '60 days'
      ORDER BY s.end_date ASC
    `);

    res.json({
      total_clients: basic.total_clients,
      total_active_clients: basic.total_active_clients,
      total_invested_aum: aum.total_invested_aum,
      market_value_aum: aum.market_value_aum,
      monthly_sip_book: basic.monthly_sip_book,
      expected_aum_12m: Number(aum.total_invested_aum) + (Number(basic.monthly_sip_book) * 12),
      avg_assets_per_client: basic.total_active_clients > 0 ? (Number(aum.total_invested_aum) / basic.total_active_clients) : 0,
      comm_inv_annual: aum.comm_inv_annual,
      comm_inv_monthly: Number(aum.comm_inv_annual) / 12,
      comm_mkt_annual: aum.comm_mkt_annual,
      comm_mkt_monthly: Number(aum.comm_mkt_annual) / 12,
      new_clients_30d: basic.new_clients_30d,
      upcomingBirthdays: upcomingBirthdays,
      sipsEndingSoon: sipsEndingRes.rows 
    });
  } catch (err) {
    console.error("❌ Business Stats Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 🏆 LEADERBOARDS DASHBOARD LOGIC
 */
export const getLeaderboardsStats = async (req, res) => {
  try {
    // 1. Get Total Invested AUM
    const totalAumRes = await pool.query(`
      WITH txn_sum AS (
        SELECT COALESCE(SUM(CASE 
          WHEN LOWER(TRIM(transaction_type)) IN ('purchase', 'switch in', 'switch_in') THEN amount::NUMERIC 
          WHEN LOWER(TRIM(transaction_type)) IN ('redemption', 'switch out', 'switch_out') THEN -amount::NUMERIC 
          ELSE 0 END), 0) as amt FROM transactions
      ),
      sip_sum AS (
        SELECT COALESCE(SUM(amount::NUMERIC * (EXTRACT(YEAR FROM AGE((CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'), start_date)) * 12 + EXTRACT(MONTH FROM AGE((CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'), start_date)) + 1)), 0) as amt 
        FROM sips WHERE LOWER(status) = 'active'
      )
      SELECT (txn_sum.amt + sip_sum.amt) as total_invested_aum FROM txn_sum, sip_sum
    `);
    const total_invested_aum = Number(totalAumRes.rows[0].total_invested_aum) || 0;

    // 2. Top 5 Funds
    const topFundsRes = await pool.query(`
      WITH fund_exposure AS (
        SELECT 
          m.scheme_name,
          COALESCE((
            SELECT SUM(CASE 
              WHEN LOWER(TRIM(transaction_type)) IN ('purchase', 'switch in', 'switch_in') THEN amount::NUMERIC 
              WHEN LOWER(TRIM(transaction_type)) IN ('redemption', 'switch out', 'switch_out') THEN -amount::NUMERIC 
              ELSE 0 END) 
            FROM transactions WHERE scheme_id::TEXT = m.id::TEXT
          ), 0) +
          COALESCE((
            SELECT SUM(amount::NUMERIC * (EXTRACT(YEAR FROM AGE((CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'), start_date)) * 12 + EXTRACT(MONTH FROM AGE((CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'), start_date)) + 1)) 
            FROM sips WHERE scheme_id::TEXT = m.id::TEXT AND LOWER(status) = 'active'
          ), 0) as invested_value
        FROM mf_schemes m
      )
      SELECT scheme_name, invested_value 
      FROM fund_exposure 
      WHERE invested_value > 0 
      ORDER BY invested_value DESC 
      LIMIT 5
    `);

    // 3. Top 10 Clients
    const topClientsRes = await pool.query(`
      WITH client_exposure AS (
        SELECT 
          c.full_name,
          c.client_code,
          COALESCE((
            SELECT SUM(CASE 
              WHEN LOWER(TRIM(transaction_type)) IN ('purchase', 'switch in', 'switch_in') THEN amount::NUMERIC 
              WHEN LOWER(TRIM(transaction_type)) IN ('redemption', 'switch out', 'switch_out') THEN -amount::NUMERIC 
              ELSE 0 END) 
            FROM transactions WHERE client_id::TEXT = c.id::TEXT
          ), 0) +
          COALESCE((
            SELECT SUM(amount::NUMERIC * (EXTRACT(YEAR FROM AGE((CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'), start_date)) * 12 + EXTRACT(MONTH FROM AGE((CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'), start_date)) + 1)) 
            FROM sips WHERE client_id::TEXT = c.id::TEXT AND LOWER(status) = 'active'
          ), 0) as invested_value
        FROM clients c
      )
      SELECT full_name, client_code, invested_value 
      FROM client_exposure 
      WHERE invested_value > 0 
      ORDER BY invested_value DESC 
      LIMIT 10
    `);

    // 4. 🟢 UPDATED: Top 5 Sub Distributors (JOIN with sub_distributors table)
    const topSourcesRes = await pool.query(`
      WITH source_exposure AS (
        SELECT 
          sd.name,
          COUNT(DISTINCT c.id) as client_count,
          SUM(
            COALESCE((
              SELECT SUM(CASE 
                WHEN LOWER(TRIM(transaction_type)) IN ('purchase', 'switch in', 'switch_in') THEN amount::NUMERIC 
                WHEN LOWER(TRIM(transaction_type)) IN ('redemption', 'switch out', 'switch_out') THEN -amount::NUMERIC 
                ELSE 0 END) 
              FROM transactions WHERE client_id::TEXT = c.id::TEXT
            ), 0) +
            COALESCE((
              SELECT SUM(amount::NUMERIC * (EXTRACT(YEAR FROM AGE((CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'), start_date)) * 12 + EXTRACT(MONTH FROM AGE((CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'), start_date)) + 1)) 
              FROM sips WHERE client_id::TEXT = c.id::TEXT AND LOWER(status) = 'active'
            ), 0)
          ) as invested_value
        FROM sub_distributors sd
        JOIN clients c ON c.sub_distributor_id = sd.id
        GROUP BY sd.id, sd.name
      )
      SELECT name, client_count, invested_value 
      FROM source_exposure 
      WHERE invested_value > 0 
      ORDER BY invested_value DESC 
      LIMIT 5
    `);

    res.json({
      total_invested_aum,
      topFunds: topFundsRes.rows,
      topClients: topClientsRes.rows,
      topSources: topSourcesRes.rows
    });
  } catch (err) {
    console.error("❌ Leaderboards Stats Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 👤 CLIENT DASHBOARD LOGIC
 */
export const getClientDashboardStats = async (req, res) => {
  const { id } = req.params;
  try {
    const clientRes = await pool.query("SELECT * FROM clients WHERE id::TEXT = $1::TEXT", [id]);
    if (clientRes.rows.length === 0) return res.status(404).json({ error: "Client not found" });
    
    const client = clientRes.rows[0];
    const actualDob = client.dob || client.date_of_birth;

    const portfolioQuery = `
      SELECT m.scheme_name, m.large_cap, m.mid_cap, m.small_cap, m.debt_allocation, m.gold_allocation,
      COALESCE((SELECT SUM(CASE 
        WHEN LOWER(TRIM(transaction_type)) IN ('purchase', 'switch in', 'switch_in') THEN amount::NUMERIC 
        WHEN LOWER(TRIM(transaction_type)) IN ('redemption', 'switch out', 'switch_out') THEN -amount::NUMERIC 
        ELSE 0 END) 
      FROM transactions WHERE client_id::TEXT = $1::TEXT AND scheme_id::TEXT = m.id::TEXT), 0) +
      COALESCE((SELECT SUM(amount::NUMERIC * (EXTRACT(YEAR FROM AGE((CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'), start_date)) * 12 + EXTRACT(MONTH FROM AGE((CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'), start_date)) + 1)) FROM sips WHERE client_id::TEXT = $1::TEXT AND scheme_id::TEXT = m.id::TEXT AND LOWER(status) = 'active'), 0) as invested_amount,
      COALESCE((SELECT SUM(amount::NUMERIC) FROM sips WHERE client_id::TEXT = $1::TEXT AND scheme_id::TEXT = m.id::TEXT AND LOWER(status) = 'active'), 0) as sip_amount
      FROM mf_schemes m
      WHERE m.id::TEXT IN (SELECT scheme_id::TEXT FROM transactions WHERE client_id::TEXT = $1::TEXT UNION SELECT scheme_id::TEXT FROM sips WHERE client_id::TEXT = $1::TEXT)
    `;
    const portfolioRes = await pool.query(portfolioQuery, [id]);
    const portfolio = portfolioRes.rows;
    const totalAUM = portfolio.reduce((sum, r) => sum + Number(r.invested_amount), 0);
    const totalSipBook = portfolio.reduce((sum, r) => sum + Number(r.sip_amount), 0);
    const alertRes = await pool.query(
      "SELECT COUNT(*)::INT FROM sips WHERE client_id::TEXT = $1::TEXT AND LOWER(status) = 'active' AND end_date <= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date + INTERVAL '60 days' AND end_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date",
      [id]
    );

    res.json({
      profile: { ...client, age: calculateAge(actualDob), since_formatted: client.onboarding_date ? new Date(client.onboarding_date).toLocaleDateString('en-IN') : 'N/A' },
      summary: { totalAUM, totalSipBook, sipCount: portfolio.filter(r => Number(r.sip_amount) > 0).length },
      portfolio: portfolio.map(r => ({ ...r, percentage: totalAUM > 0 ? ((Number(r.invested_amount) / totalAUM) * 100).toFixed(1) : 0 })),
      alerts: alertRes.rows[0].count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};