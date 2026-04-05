import { pool } from '../config/db.js';

// 🛡️ Safe Date Parser Helper (Understands Date objects, YYYY-MM-DD, and DD-MM-YYYY)
const parseSafeDate = (dateStr) => {
  if (!dateStr || String(dateStr).trim() === "") return null;
  
  // If PostgreSQL already converted it to a JS Date object natively
  if (dateStr instanceof Date) return dateStr;

  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  
  // Fallback for tricky string formats stuck in the database
  const parts = String(dateStr).split('-');
  if (parts.length === 3 && parts[2].length === 4) { 
    d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`); // Convert to YYYY-MM-DD
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
    // 1. Basic Stats
    const statsQuery = `
      WITH current_ist AS (
        SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date as today
      )
      SELECT 
        (SELECT COUNT(*)::INT FROM clients WHERE is_active = true) as total_clients,
        (SELECT COUNT(*)::INT FROM clients WHERE onboarding_date >= (SELECT today FROM current_ist) - INTERVAL '30 days') as new_clients_30d,
        (SELECT COALESCE(SUM(amount::NUMERIC), 0) FROM sips WHERE LOWER(status) = 'active') as monthly_sip_book
    `;
    const basicRes = await pool.query(statsQuery);
    const basic = basicRes.rows[0];

    // 2. AUM & Commission Calculations
    const aumQuery = `
      WITH scheme_calc AS (
        SELECT 
          m.id, 
          m.commission_rate, 
          COALESCE(m.total_current_value, 0) as market_value,
          COALESCE((
            SELECT SUM(CASE WHEN LOWER(transaction_type) IN ('purchase', 'switch in') THEN amount::NUMERIC WHEN LOWER(transaction_type) IN ('redemption', 'switch out') THEN -amount::NUMERIC ELSE 0 END) 
            FROM transactions WHERE scheme_id::TEXT = m.id::TEXT
          ), 0) as trans_invested,
          COALESCE((
            SELECT SUM(amount::NUMERIC * (EXTRACT(YEAR FROM AGE((CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'), start_date)) * 12 + EXTRACT(MONTH FROM AGE((CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'), start_date)) + 1)) 
            FROM sips WHERE scheme_id::TEXT = m.id::TEXT
          ), 0) as sip_invested
        FROM mf_schemes m
      )
      SELECT 
        COALESCE(SUM(trans_invested + sip_invested), 0) as total_invested_aum,
        COALESCE(SUM(market_value), 0) as total_market_value,
        COALESCE(SUM(market_value * (COALESCE(commission_rate, 0.8) / 100) / 12), 0) as comm_market_value
      FROM scheme_calc
    `;
    const aumRes = await pool.query(aumQuery);
    const aum = aumRes.rows[0];

    // 3. 🎂 JAVASCRIPT-POWERED BIRTHDAY LOGIC WITH DIAGNOSTICS
    // 💡 THE FIX: Asking for both 'dob' and 'date_of_birth' columns just to be absolutely sure.
    const clientsRes = await pool.query(`
      SELECT full_name, dob, date_of_birth 
      FROM clients 
      WHERE (dob IS NOT NULL AND TRIM(dob::text) != '') 
         OR (date_of_birth IS NOT NULL AND TRIM(date_of_birth::text) != '')
    `);
    
    // Get today's exact date in India timezone
    const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    today.setHours(0, 0, 0, 0);

    let upcomingBirthdays = [];

    console.log("\n---- 🕵️ BIRTHDAY DIAGNOSTICS START ----");
    console.log(`Current Dashboard 'Today' Date: ${today.toDateString()}`);

    clientsRes.rows.forEach(client => {
      // Safely grab whichever column actually holds the date
      const rawDate = client.dob || client.date_of_birth;
      const bday = parseSafeDate(rawDate);

      console.log(`👤 Client: ${client.full_name} | Raw DB Date: ${rawDate} | Parsed: ${bday ? bday.toDateString() : 'INVALID'}`);

      if (!bday) return; // Skip if invalid date

      // Create a date object for this year's birthday
      let nextBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());

      // If the birthday already happened this year, look at next year
      if (nextBday < today) {
        nextBday.setFullYear(today.getFullYear() + 1);
      }

      // Calculate the difference in absolute days
      const diffTime = nextBday - today;
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      console.log(`   👉 Next Bday: ${nextBday.toDateString()} | Days Left: ${daysLeft}`);

      // If it falls within the next 7 days, push it to our array
      if (daysLeft >= 0 && daysLeft <= 7) {
        upcomingBirthdays.push({
          full_name: client.full_name,
          dob: rawDate, // Send original for frontend display
          days_left: daysLeft
        });
      }
    });
    console.log("---- 🕵️ BIRTHDAY DIAGNOSTICS END ----\n");

    // Sort by soonest birthdays first
    upcomingBirthdays.sort((a, b) => a.days_left - b.days_left);

    // 4. Top Funds
    const topFundsRes = await pool.query(`
      SELECT scheme_name, COALESCE(total_current_value, 0) as invested_value 
      FROM mf_schemes 
      WHERE total_current_value > 0 
      ORDER BY total_current_value DESC LIMIT 3
    `);

    res.json({
      ...basic,
      ...aum,
      forecast_aum: Number(aum.total_invested_aum) + (Number(basic.monthly_sip_book) * 12),
      monthly_revenue: aum.comm_market_value || 0,
      annual_yield: (aum.comm_market_value || 0) * 12,
      topFunds: topFundsRes.rows,
      upcomingBirthdays: upcomingBirthdays
    });
  } catch (err) {
    console.error("❌ Business Stats Error:", err.message);
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
      COALESCE((SELECT SUM(CASE WHEN LOWER(transaction_type) IN ('purchase', 'switch in') THEN amount::NUMERIC WHEN LOWER(transaction_type) IN ('redemption', 'switch out') THEN -amount::NUMERIC ELSE 0 END) FROM transactions WHERE client_id::TEXT = $1::TEXT AND scheme_id::TEXT = m.id::TEXT), 0) +
      COALESCE((SELECT SUM(amount::NUMERIC * (EXTRACT(YEAR FROM AGE((CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'), start_date)) * 12 + EXTRACT(MONTH FROM AGE((CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'), start_date)) + 1)) FROM sips WHERE client_id::TEXT = $1::TEXT AND scheme_id::TEXT = m.id::TEXT), 0) as invested_amount,
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
      profile: { 
        ...client, 
        age: calculateAge(actualDob), 
        since_formatted: client.onboarding_date ? new Date(client.onboarding_date).toLocaleDateString('en-IN') : 'N/A' 
      },
      summary: { totalAUM, totalSipBook, sipCount: portfolio.filter(r => Number(r.sip_amount) > 0).length },
      portfolio: portfolio.map(r => ({ ...r, percentage: totalAUM > 0 ? ((Number(r.invested_amount) / totalAUM) * 100).toFixed(1) : 0 })),
      alerts: alertRes.rows[0].count
    });
  } catch (err) {
    console.error("❌ Client Stats Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};