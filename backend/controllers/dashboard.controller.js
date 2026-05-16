/* eslint-disable no-unused-vars */
import { pool } from '../config/db.js';
import { MathService } from '../services/MathService.js';

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
 * 🟢 TOTAL BUSINESS AUM (Simplified via MathService)
 */
export const getBusinessTotalAUM = async (req, res) => {
  try {
    const totalAUM = await MathService.calculateInvestedAUM();
    res.json({ totalAUM });
  } catch (err) {
    console.error("❌ getBusinessTotalAUM Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 🏢 BUSINESS DASHBOARD LOGIC (With Active Portfolio Analytics & Cleared Annual Projections)
 */
export const getBusinessStats = async (req, res) => {
  try {
    // 1. Basic Counts, Structural Configurations, Compliance, and Live Active Balances
    const basicQuery = `
      WITH current_ist AS (
        SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date as today
      ),
      client_balances AS (
        SELECT t.client_id, 
               SUM(CASE 
                 WHEN LOWER(TRIM(t.transaction_type)) IN ('purchase', 'switch in', 'switch_in', 'sip installment') THEN t.amount::NUMERIC 
                 WHEN LOWER(TRIM(t.transaction_type)) IN ('redemption', 'switch out', 'switch_out', 'sip missed') THEN -t.amount::NUMERIC 
                 ELSE 0 END) as net_balance
        FROM transactions t
        GROUP BY t.client_id
      )
      SELECT 
        (SELECT COUNT(*)::INT FROM clients WHERE is_active = true) as total_clients,
        (SELECT COUNT(*)::INT FROM clients WHERE onboarding_date >= (SELECT today FROM current_ist) - INTERVAL '30 days') as new_clients_30d,
        (SELECT COALESCE(SUM(amount::NUMERIC), 0) FROM sips WHERE LOWER(status) = 'active') as monthly_sip_book,
        (SELECT COALESCE(SUM(total_current_value), 0) FROM mf_schemes) as market_value_aum,
        (SELECT COUNT(*)::INT FROM clients WHERE is_active = true AND (nominee_name IS NULL OR TRIM(nominee_name) = '')) as nominee_pending,
        (SELECT COUNT(DISTINCT family_id)::INT FROM clients WHERE is_active = true AND family_id IS NOT NULL) as total_families,
        (SELECT COUNT(*)::INT FROM sub_distributors) as total_sub_distributors,
        (SELECT COUNT(*)::INT FROM clients WHERE is_active = true AND next_review_date < (SELECT today FROM current_ist)) as overdue_reviews,
        (SELECT COUNT(*)::INT FROM clients WHERE is_active = true AND next_review_date BETWEEN (SELECT today FROM current_ist) AND (SELECT today FROM current_ist) + INTERVAL '7 days') as due_7d_reviews,
        -- Counts unique active clients whose net transaction tracking volume > 0
        (SELECT COUNT(DISTINCT cb.client_id)::INT 
         FROM client_balances cb
         JOIN clients c ON cb.client_id::TEXT = c.id::TEXT
         WHERE c.is_active = true AND cb.net_balance > 0) as active_invested_clients
    `;
    const basicRes = await pool.query(basicQuery);
    const basic = basicRes.rows[0];

    // 2. Call Centralized Brain (MathService)
    const totalInvested = await MathService.calculateInvestedAUM();
    const commMarketMonthly = await MathService.getMonthlyCommission();

    // 3. Organic Direct-to-Firm Resource Isolation Logic (Internal Sourcing Split)
    const internalAumQuery = `
      WITH internal_book AS (
        SELECT 
          COALESCE((
            SELECT SUM(CASE 
              WHEN LOWER(TRIM(transaction_type)) IN ('purchase', 'switch in', 'switch_in', 'sip installment') THEN t.amount::NUMERIC 
              WHEN LOWER(TRIM(transaction_type)) IN ('redemption', 'switch out', 'switch_out', 'sip missed') THEN -t.amount::NUMERIC 
              ELSE 0 END) 
            FROM transactions t
            JOIN clients cl ON t.client_id::TEXT = cl.id::TEXT
            WHERE cl.is_active = true AND cl.sub_distributor_id IS NULL
          ), 0) + 
          COALESCE((
            SELECT SUM(s.amount::NUMERIC * (
              GREATEST(0, (EXTRACT(YEAR FROM AGE(LEAST(CURRENT_DATE, COALESCE(s.end_date, CURRENT_DATE)), s.start_date)) * 12 + 
              EXTRACT(MONTH FROM AGE(LEAST(CURRENT_DATE, COALESCE(s.end_date, CURRENT_DATE)), s.start_date)) + 1))
            )) 
            FROM sips s
            JOIN clients cl ON s.client_id::TEXT = cl.id::TEXT
            WHERE cl.is_active = true AND cl.sub_distributor_id IS NULL AND LOWER(s.status) = 'active'
          ), 0) AS direct_aum
      )
      SELECT direct_aum FROM internal_book;
    `;
    const internalAumRes = await pool.query(internalAumQuery);
    const directAumValue = Number(internalAumRes.rows[0]?.direct_aum || 0);

    // Formulate clean acquisition ratio breakdown
    const internalAumPct = totalInvested > 0 
      ? Number(((directAumValue / totalInvested) * 100).toFixed(1)) 
      : 0;

    // 4. Additional Insights (Birthdays)
    const clientsRes = await pool.query("SELECT full_name, dob, date_of_birth FROM clients WHERE is_active = true");
    const today = new Date();
    let upcomingBirthdays = [];
    
    clientsRes.rows.forEach(client => {
      const bday = parseSafeDate(client.dob || client.date_of_birth);
      if (!bday) return;
      let nextBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
      if (nextBday < today) nextBday.setFullYear(today.getFullYear() + 1);
      const daysLeft = Math.ceil((nextBday - today) / (1000 * 60 * 60 * 24));
      if (daysLeft >= 0 && daysLeft <= 7) {
        upcomingBirthdays.push({ full_name: client.full_name, dob: client.dob || client.date_of_birth, days_left: daysLeft });
      }
    });

    // Calculates precise month boundaries
    const monthlyInvestedComm = (totalInvested * 0.008) / 12;

    // 5. Construct Clean JSON Payload containing Active Portfolios Counter
    res.json({
      total_clients: basic.total_clients,
      total_invested_aum: totalInvested,
      market_value_aum: basic.market_value_aum,
      monthly_sip_book: basic.monthly_sip_book,
      expected_aum_12m: totalInvested + (Number(basic.monthly_sip_book) * 12),
      comm_inv_monthly: monthlyInvestedComm, 
      comm_mkt_monthly: commMarketMonthly,
      new_clients_30d: basic.new_clients_30d,
      upcomingBirthdays: upcomingBirthdays.sort((a,b) => a.days_left - b.days_left),
      nominee_pending: basic.nominee_pending,
      total_families: basic.total_families,
      total_sub_distributors: basic.total_sub_distributors,
      internal_aum_pct: internalAumPct,
      active_invested_clients: basic.active_invested_clients || 0,
      review_stats: {
        overdue: basic.overdue_reviews || 0,
        due_7d: basic.due_7d_reviews || 0
      }
    });
  } catch (err) {
    console.error("❌ Business Stats Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 🏆 LEADERBOARDS DASHBOARD LOGIC (Fixed: Full structural populating across all three panels)
 */
export const getLeaderboardsStats = async (req, res) => {
  try {
    const total_invested_aum = await MathService.calculateInvestedAUM();

    // 1. Query Top 5 Funds by Exposure based on net transaction metrics
    const topFundsRes = await pool.query(`
      SELECT 
        m.scheme_name,
        COALESCE(SUM(CASE 
          WHEN LOWER(TRIM(t.transaction_type)) IN ('purchase', 'switch in', 'switch_in', 'sip installment') THEN t.amount::NUMERIC 
          WHEN LOWER(TRIM(t.transaction_type)) IN ('redemption', 'switch out', 'switch_out', 'sip missed') THEN -t.amount::NUMERIC 
          ELSE 0 END), 0) as invested_value
      FROM transactions t
      JOIN mf_schemes m ON t.scheme_id::TEXT = m.id::TEXT
      GROUP BY m.id, m.scheme_name
      HAVING SUM(CASE 
        WHEN LOWER(TRIM(t.transaction_type)) IN ('purchase', 'switch in', 'switch_in', 'sip installment') THEN t.amount::NUMERIC 
        WHEN LOWER(TRIM(t.transaction_type)) IN ('redemption', 'switch out', 'switch_out', 'sip missed') THEN -t.amount::NUMERIC 
        ELSE 0 END) > 0
      ORDER BY invested_value DESC LIMIT 5
    `);

    // 2. Query Top 10 Active Clients by Net Invested Portfolio Position
    const topClientsRes = await pool.query(`
      SELECT 
        c.full_name,
        c.client_code,
        COALESCE(SUM(CASE 
          WHEN LOWER(TRIM(t.transaction_type)) IN ('purchase', 'switch in', 'switch_in', 'sip installment') THEN t.amount::NUMERIC 
          WHEN LOWER(TRIM(t.transaction_type)) IN ('redemption', 'switch out', 'switch_out', 'sip missed') THEN -t.amount::NUMERIC 
          ELSE 0 END), 0) as invested_value
      FROM clients c
      JOIN transactions t ON c.id::TEXT = t.client_id::TEXT
      WHERE c.is_active = true
      GROUP BY c.id, c.full_name, c.client_code
      ORDER BY invested_value DESC LIMIT 10
    `);

    // 3. Query Partner Leaderboard Intermediary Network
    const topSourcesRes = await pool.query(`
      SELECT 
        sd.name,
        COUNT(DISTINCT c.id) as client_count,
        COALESCE(SUM(CASE 
            WHEN LOWER(TRIM(t.transaction_type)) IN ('purchase', 'switch in', 'switch_in', 'sip installment') THEN t.amount::NUMERIC 
            WHEN LOWER(TRIM(t.transaction_type)) IN ('redemption', 'switch out', 'switch_out', 'sip missed') THEN -t.amount::NUMERIC 
            ELSE 0 END), 0) as invested_value
      FROM sub_distributors sd
      JOIN clients c ON c.sub_distributor_id = sd.id
      LEFT JOIN transactions t ON c.id::TEXT = t.client_id::TEXT
      GROUP BY sd.id, sd.name
      ORDER BY invested_value DESC LIMIT 5
    `);

    res.json({
      total_invested_aum,
      topFunds: topFundsRes.rows,
      topClients: topClientsRes.rows,
      topSources: topSourcesRes.rows,
    });
  } catch (err) {
    console.error("❌ getLeaderboardsStats Error:", err.message);
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
    const totalAUM = await MathService.calculateInvestedAUM(id);

    res.json({
      profile: { ...client, age: calculateAge(client.dob || client.date_of_birth) },
      summary: { totalAUM }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 📸 SNAPSHOT ENGINE
 */
export const triggerMonthlySnapshot = async (req, res) => {
  try {
    const invested_aum = await MathService.calculateInvestedAUM();
    const monthly_comm = await MathService.getMonthlyCommission();

    const snapshotQuery = `
      INSERT INTO monthly_analytics (snapshot_date, total_invested, total_market_value, sip_book_amount, actual_commission)
      VALUES (CURRENT_DATE, $1, (SELECT COALESCE(SUM(total_current_value),0) FROM mf_schemes), (SELECT COALESCE(SUM(amount::NUMERIC),0) FROM sips WHERE status='active'), $2)
      ON CONFLICT (snapshot_date) DO UPDATE SET total_invested = EXCLUDED.total_invested, actual_commission = EXCLUDED.actual_commission
    `;
    
    await pool.query(snapshotQuery, [invested_aum, monthly_comm]);
    res.json({ success: true, message: "Snapshot captured accurately!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to capture snapshot" });
  }
};

/**
 * 🛡️ SYSTEM BACKUP ENGINE
 */
export const exportSystemBackup = async (req, res) => {
  try {
    const tables = ['clients', 'families', 'mf_schemes', 'transactions', 'sips', 'sub_distributors', 'monthly_analytics', 'audit_logs', 'users'];
    const backup = { timestamp: new Date().toISOString(), source: "VisionBridge Ventures Portal", data: {} };

    for (const table of tables) {
      const result = await pool.query(`SELECT * FROM ${table}`);
      backup.data[table] = result.rows;
    }
    res.json(backup);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate system backup" });
  }
};