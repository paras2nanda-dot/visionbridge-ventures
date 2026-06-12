/* eslint-disable no-unused-vars */
import { pool } from '../config/db.js';
import { MathService } from '../services/MathService.js';
import { logActivity } from './activityController.js'; // Ensure logActivity is imported if used in CRUD

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
 * 🏢 BUSINESS DASHBOARD LOGIC
 */
export const getBusinessStats = async (req, res) => {
  try {
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
        (SELECT COUNT(DISTINCT cb.client_id)::INT 
         FROM client_balances cb
         JOIN clients c ON cb.client_id::TEXT = c.id::TEXT
         WHERE cb.net_balance > 0) as active_invested_clients
    `;
    const basicRes = await pool.query(basicQuery);
    const basic = basicRes.rows[0];

    const totalInvested = await MathService.calculateInvestedAUM();
    const externalAum = await MathService.calculateExternalAUM();
    const commMarketMonthly = await MathService.getMonthlyCommission();

    let internalAumPct = 0;
    if (totalInvested > 0) {
      // Calculate Internal by subtracting External from Total
      const internalAum = Math.max(0, totalInvested - externalAum);
      internalAumPct = Number(((internalAum / totalInvested) * 100).toFixed(1));
    }

    // Ultimate safety clamps
    if (internalAumPct > 100) internalAumPct = 100;
    if (internalAumPct < 0) internalAumPct = 0;

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

    const monthlyInvestedComm = (totalInvested * 0.008) / 12;

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
      review_stats: { overdue: 0, due_7d: 0 }
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
    const total_invested_aum = await MathService.calculateInvestedAUM();

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

    res.json({ total_invested_aum, topFunds: topFundsRes.rows, topClients: topClientsRes.rows, topSources: topSourcesRes.rows });
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

    const totalBusinessAUM = await MathService.calculateInvestedAUM();

    let familyMembers = [];
    if (client.family_id) {
      const famRes = await pool.query("SELECT * FROM clients WHERE family_id = $1 AND is_active = true", [client.family_id]);
      familyMembers = famRes.rows;
    } else {
      familyMembers = [client];
    }

    let groupAUM = 0;
    let nomineesVerified = true;

    const processedMembers = await Promise.all(familyMembers.map(async (m) => {
      const memberAUM = await MathService.calculateInvestedAUM(m.id);
      groupAUM += memberAUM;

      const sipRes = await pool.query(
        "SELECT COALESCE(SUM(amount::NUMERIC), 0) as monthly_sip FROM sips WHERE client_id::TEXT = $1::TEXT AND LOWER(status) = 'active'", 
        [m.id]
      );
      const monthlySip = parseFloat(sipRes.rows[0]?.monthly_sip || 0);

      if (!m.nominee_name || m.nominee_name.trim() === '') {
        nomineesVerified = false; 
      }

      return {
        id: m.id,
        full_name: m.full_name,
        client_code: m.client_code,
        role: String(m.id) === String(id) ? "Primary" : "Dependent",
        age: calculateAge(m.dob || m.date_of_birth),
        monthly_sip: monthlySip,
        invested_aum: memberAUM,
        weight: 0 
      };
    }));

    processedMembers.forEach(m => {
      m.weight = groupAUM > 0 ? Number(((m.invested_aum / groupAUM) * 100).toFixed(1)) : 0;
    });

    const allocationQuery = `
      SELECT 
        m.scheme_name AS name,
        SUM(CASE 
          WHEN LOWER(TRIM(t.transaction_type)) IN ('purchase', 'switch in', 'switch_in', 'sip installment') THEN t.amount::NUMERIC 
          WHEN LOWER(TRIM(t.transaction_type)) IN ('redemption', 'switch out', 'switch_out', 'sip missed') THEN -t.amount::NUMERIC 
          ELSE 0 END) as value
      FROM transactions t
      JOIN mf_schemes m ON t.scheme_id::TEXT = m.id::TEXT
      WHERE t.client_id::TEXT = $1::TEXT
      GROUP BY m.scheme_name
      HAVING SUM(CASE 
        WHEN LOWER(TRIM(t.transaction_type)) IN ('purchase', 'switch in', 'switch_in', 'sip installment') THEN t.amount::NUMERIC 
        WHEN LOWER(TRIM(t.transaction_type)) IN ('redemption', 'switch out', 'switch_out', 'sip missed') THEN -t.amount::NUMERIC 
        ELSE 0 END) > 0;
    `;
    const allocationRes = await pool.query(allocationQuery, [id]);

    const rawDate = client.onboarding_date || client.created_at;
    const formattedOnboardingDate = rawDate 
      ? new Date(rawDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
      : "N/A";

    const bookPercentage = totalBusinessAUM > 0 ? Number(((groupAUM / totalBusinessAUM) * 100).toFixed(2)) : 0;

    res.json({
      profile: { ...client, age: calculateAge(client.dob || client.date_of_birth), onboarding_date: formattedOnboardingDate, nominees_verified: nomineesVerified },
      summary: { totalAUM: await MathService.calculateInvestedAUM(id), group_aum: groupAUM, book_percentage: bookPercentage },
      family: { total_members: familyMembers.length, group_aum: groupAUM, book_percentage: bookPercentage, nominees_verified: nomineesVerified, members: processedMembers },
      allocation: allocationRes.rows
    });

  } catch (err) {
    console.error("❌ getClientDashboardStats Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 📸 SNAPSHOT ENGINE (BULLETPROOF V3)
 * Completely bypasses PostgreSQL Date/Timestamp casting crashes.
 * Calculates values safely, ensures numbers are sent to DB, and routes inserts via JS limits.
 */
export const triggerMonthlySnapshot = async (req, res) => {
  try {
    const invested_aum = Number(await MathService.calculateInvestedAUM()) || 0;
    const monthly_comm = Number(await MathService.getMonthlyCommission()) || 0;

    const marketValueRes = await pool.query(`SELECT COALESCE(SUM(total_current_value), 0) as mv FROM mf_schemes`);
    const total_market_value = Number(marketValueRes.rows[0]?.mv) || 0;

    const sipBookRes = await pool.query(`SELECT COALESCE(SUM(amount::NUMERIC), 0) as sb FROM sips WHERE LOWER(status) = 'active' AND start_date <= CURRENT_DATE`);
    const sip_book_amount = Number(sipBookRes.rows[0]?.sb) || 0;

    // 🟢 JS Date matching avoids DB Unique Key / Timestamp collisions
    const historyRes = await pool.query(`SELECT id, snapshot_date FROM monthly_analytics`);
    const todayStr = new Date().toISOString().split('T')[0];
    
    const existingRecord = historyRes.rows.find(row => {
      if (!row.snapshot_date) return false;
      const rowDate = new Date(row.snapshot_date).toISOString().split('T')[0];
      return rowDate === todayStr;
    });

    if (existingRecord) {
      await pool.query(`
        UPDATE monthly_analytics 
        SET total_invested = $1, 
            total_market_value = $2,
            sip_book_amount = $3,
            actual_commission = $4
        WHERE id = $5
      `, [invested_aum, total_market_value, sip_book_amount, monthly_comm, existingRecord.id]);
    } else {
      await pool.query(`
        INSERT INTO monthly_analytics (snapshot_date, total_invested, total_market_value, sip_book_amount, actual_commission)
        VALUES (CURRENT_DATE, $1, $2, $3, $4)
      `, [invested_aum, total_market_value, sip_book_amount, monthly_comm]);
    }

    res.json({ success: true, message: "Snapshot captured accurately!" });
  } catch (err) {
    console.error("❌ Snapshot Error Details:", err.message);
    res.status(500).json({ error: "DB Error: " + err.message });
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
    console.error("❌ System Backup Error:", err.message);
    res.status(500).json({ error: "Failed to generate system backup" });
  }
};

/**
 * 💰 MF SCHEME CRUD LOGIC (RESTORED)
 */
export const getSchemes = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM mf_schemes ORDER BY amc_name ASC, scheme_name ASC');
    res.json(result.rows);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

export const createScheme = async (req, res) => {
  const s = req.body;
  const user = req.user?.username || "System";
  const safeCategory = s.category === 'Other' ? 'Equity' : s.category;

  try {
    const result = await pool.query(
      `INSERT INTO mf_schemes 
      (scheme_name, amc_name, category, sub_category, large_cap, mid_cap, small_cap, debt_allocation, gold_allocation, global_equity, reit, commission_rate, total_current_value) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        s.scheme_name, s.amc_name, safeCategory, s.sub_category, 
        Number(s.large_cap || 0), Number(s.mid_cap || 0), Number(s.small_cap || 0), 
        Number(s.debt_allocation || 0), Number(s.gold_allocation || 0),
        Number(s.global_equity || 0), Number(s.reit || 0),
        Number(s.commission_rate || 0.8), Number(s.total_current_value || 0)
      ]
    );
    
    const newScheme = result.rows[0];
    await logActivity(user, 'CREATE', newScheme.scheme_name, `✨ Added new mutual fund scheme (${newScheme.scheme_name}).`, null, newScheme);

    res.status(201).json(newScheme);
  } catch (err) { 
    console.error("DB Error:", err.message);
    res.status(400).json({ error: "Database save error: " + err.message }); 
  }
};

export const updateScheme = async (req, res) => {
  const { id } = req.params;
  const s = req.body;
  const user = req.user?.username || "System";
  
  try {
    const oldRes = await pool.query('SELECT * FROM mf_schemes WHERE id = $1', [id]);
    if (oldRes.rows.length === 0) return res.status(404).json({ error: "Not found" });
    const oldData = oldRes.rows[0];

    const query = `
      UPDATE mf_schemes SET 
        scheme_name = $1, 
        amc_name = $2, 
        category = $3, 
        sub_category = $4, 
        large_cap = $5, 
        mid_cap = $6, 
        small_cap = $7, 
        debt_allocation = $8, 
        gold_allocation = $9, 
        global_equity = $10,
        reit = $11,
        commission_rate = $12, 
        total_current_value = $13
      WHERE id = $14 RETURNING *`;
      
    const values = [
      s.scheme_name, s.amc_name, s.category, s.sub_category, 
      Number(s.large_cap || 0), Number(s.mid_cap || 0), Number(s.small_cap || 0), 
      Number(s.debt_allocation || 0), Number(s.gold_allocation || 0),
      Number(s.global_equity || 0), Number(s.reit || 0),
      Number(s.commission_rate || 0.8), Number(s.total_current_value || 0), 
      id
    ];

    const result = await pool.query(query, values);
    const newData = result.rows[0];

    await logActivity(user, 'UPDATE', newData.scheme_name, `Updated mutual fund scheme parameters (${newData.scheme_name}).`, oldData, newData);

    res.json(newData);
  } catch (err) { 
    console.error("Update Error:", err.message);
    res.status(400).json({ error: err.message }); 
  }
};

export const deleteScheme = async (req, res) => {
  const { id } = req.params;
  const user = req.user?.username || "System";
  
  try {
    const schemeData = await pool.query('SELECT * FROM mf_schemes WHERE id = $1', [id]);
    if (schemeData.rows.length === 0) return res.status(404).json({ error: "Not found" });
    const deletedRecord = schemeData.rows[0];

    await pool.query('DELETE FROM mf_schemes WHERE id = $1', [id]);
    
    await logActivity(user, 'DELETE', deletedRecord.scheme_name, `🗑️ Removed mutual fund scheme (${deletedRecord.scheme_name}).`, deletedRecord, null);

    res.json({ message: "Scheme deleted" });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};