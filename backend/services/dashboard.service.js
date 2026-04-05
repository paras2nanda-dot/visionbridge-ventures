import pool from "../config/db.js";

export const buildDashboard = async () => {
  try {
    // 1️⃣ Total Active Clients
    const totalClientsRes = await pool.query(
      "SELECT COUNT(*)::int AS total FROM clients WHERE is_active = true"
    );

    // 2️⃣ Invested AUM (Transactions + SIP Installments Served)
    const investedAumRes = await pool.query(`
      WITH txn_sum AS (
        SELECT COALESCE(SUM(
          CASE 
            WHEN transaction_type IN ('PURCHASE','SWITCH_IN') THEN amount
            WHEN transaction_type IN ('REDEMPTION','SWITCH_OUT') THEN -amount
            ELSE 0 
          END), 0) as amt FROM transactions
      ),
      sip_sum AS (
        SELECT COALESCE(SUM(sip_amount * (EXTRACT(YEAR FROM age(CURRENT_DATE, start_date)) * 12 + EXTRACT(MONTH FROM age(CURRENT_DATE, start_date)) + 1)
        ), 0) as amt FROM sips WHERE is_active = true
      )
      SELECT (txn_sum.amt + sip_sum.amt) as total_invested FROM txn_sum, sip_sum
    `);

    const investedAUM = Number(investedAumRes.rows[0].total_invested);

    // 3️⃣ Monthly SIP Book (Active SIPs only)
    const sipBookRes = await pool.query(
      "SELECT COALESCE(SUM(sip_amount), 0) AS sip_book FROM sips WHERE status = 'ACTIVE'"
    );
    const sipBook = Number(sipBookRes.rows[0].sip_book);

    // 4️⃣ Expected AUM (Current Invested + 1 Year of SIPs)
    const expectedAUM = investedAUM + (sipBook * 12);

    // 5️⃣ Latest Market Value AUM (From the manual entry table)
    const marketValueRes = await pool.query(
      "SELECT total_market_value FROM market_value_aum ORDER BY month_year DESC LIMIT 1"
    );
    const marketValueAUM = Number(marketValueRes.rows[0]?.total_market_value || 0);

    // 6️⃣ Expected Monthly Commissions (0.8% p.a. / 12)
    const expectedCommission = {
      invested: (investedAUM * 0.008) / 12,
      marketValue: (marketValueAUM * 0.008) / 12,
    };

    // 7️⃣ Upcoming Birthdays (Next 7 Days)
    const birthdaysRes = await pool.query(`
      SELECT full_name, date_of_birth FROM clients 
      WHERE is_active = true AND date_of_birth IS NOT NULL
      AND (to_char(date_of_birth, 'MM-DD') BETWEEN to_char(CURRENT_DATE, 'MM-DD') 
      AND to_char(CURRENT_DATE + INTERVAL '7 days', 'MM-DD'))
    `);

    return {
      totalClients: totalClientsRes.rows[0].total,
      investedAUM,
      sipBook,
      expectedAUM,
      marketValueAUM,
      expectedCommission,
      upcomingBirthdays: birthdaysRes.rows,
      lastUpdated: new Date()
    };
  } catch (err) {
    console.error("Dashboard Service Error:", err);
    throw err;
  }
};