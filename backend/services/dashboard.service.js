/* eslint-disable no-unused-vars */
import { pool } from "../config/db.js";

export const buildDashboard = async () => {
  try {
    // 1️⃣ Total Active Clients
    const totalClientsRes = await pool.query(
      "SELECT COUNT(*)::int AS total FROM clients WHERE is_active = true"
    );

    /**
     * 2️⃣ Invested AUM & Internal Acquisition Percentage
     * Calculates total corporate book AUM while simultaneously analyzing 
     * sourcing channel division (Internal vs Sub-Distributor) in one optimized database trip.
     */
    const aumMetricsRes = await pool.query(`
      WITH client_aum AS (
        SELECT 
          c.id,
          c.sub_distributor_id,
          COALESCE((
            SELECT SUM(CASE 
              WHEN LOWER(TRIM(transaction_type)) IN ('purchase', 'switch in', 'switch_in', 'sip installment') THEN amount::NUMERIC 
              WHEN LOWER(TRIM(transaction_type)) IN ('redemption', 'switch out', 'switch_out', 'sip missed') THEN -amount::NUMERIC 
              ELSE 0 END) 
            FROM transactions WHERE client_id::TEXT = c.id::TEXT
          ), 0) + 
          COALESCE((
            SELECT SUM(amount::NUMERIC * (
              GREATEST(0, (EXTRACT(YEAR FROM AGE(LEAST(CURRENT_DATE, COALESCE(end_date, CURRENT_DATE)), start_date)) * 12 + 
              EXTRACT(MONTH FROM AGE(LEAST(CURRENT_DATE, COALESCE(end_date, CURRENT_DATE)), start_date)) + 1))
            )) 
            FROM sips WHERE client_id::TEXT = c.id::TEXT AND LOWER(status) = 'active'
          ), 0) AS aum
        FROM clients c
        WHERE c.is_active = true
      ),
      aum_totals AS (
        SELECT 
          SUM(aum) as total_aum,
          SUM(CASE WHEN sub_distributor_id IS NULL THEN aum ELSE 0 END) as internal_aum
        FROM client_aum
      )
      SELECT 
        COALESCE(total_aum, 0) as total_invested,
        CASE 
          WHEN COALESCE(total_aum, 0) > 0 THEN ROUND((COALESCE(internal_aum, 0) / total_aum) * 100, 1)
          ELSE 0 
        END as internal_pct
      FROM aum_totals;
    `);

    const investedAUM = Number(aumMetricsRes.rows[0].total_invested);
    const internalAumPct = Number(aumMetricsRes.rows[0].internal_pct);

    // 3️⃣ Monthly SIP Book (Active SIPs only)
    const sipBookRes = await pool.query(
      "SELECT COALESCE(SUM(amount::NUMERIC), 0) AS sip_book FROM sips WHERE LOWER(status) = 'active'"
    );
    const sipBook = Number(sipBookRes.rows[0].sip_book);

    // 4️⃣ Expected AUM (Current Invested + 1 Year of SIPs)
    const expectedAUM = investedAUM + (sipBook * 12);

    // 5️⃣ Latest Market Value AUM (Aggregated from live Mutual Fund Master)
    const marketValueRes = await pool.query(
      "SELECT SUM(COALESCE(total_current_value, 0)) as total_market_value FROM mf_schemes"
    );
    const marketValueAUM = Number(marketValueRes.rows[0]?.total_market_value || 0);

    // 6️⃣ Expected Monthly Commissions
    const commMarketRes = await pool.query(
      "SELECT SUM(COALESCE(total_current_value, 0) * (COALESCE(commission_rate, 0.8) / 100) / 12) as monthly_comm FROM mf_schemes"
    );

    const expectedCommission = {
      invested: (investedAUM * 0.008) / 12,
      marketValue: Number(commMarketRes.rows[0]?.monthly_comm || 0),
    };

    // 7️⃣ Upcoming Birthdays (Next 7 Days)
    const birthdaysRes = await pool.query(`
      SELECT full_name, dob as date_of_birth FROM clients 
      WHERE is_active = true 
      AND (dob IS NOT NULL OR date_of_birth IS NOT NULL)
      AND (
        to_char(COALESCE(dob, date_of_birth), 'MM-DD') BETWEEN to_char(CURRENT_DATE, 'MM-DD') 
        AND to_char(CURRENT_DATE + INTERVAL '7 days', 'MM-DD')
      )
    `);

    // 8️⃣ Nominees Pending Count
    const nomineePendingRes = await pool.query(
      "SELECT COUNT(*)::int AS count FROM clients WHERE is_active = true AND (nominee_name IS NULL OR nominee_name = '')"
    );

    // 9️⃣ Total Families Count
    const familiesCountRes = await pool.query(
      "SELECT COUNT(DISTINCT family_id)::int AS count FROM clients WHERE family_id IS NOT NULL"
    );

    // 🔟 Total Sub Distributors Count
    const subDistributorsCountRes = await pool.query(
      "SELECT COUNT(*)::int AS count FROM sub_distributors"
    );

    return {
      totalClients: totalClientsRes.rows[0].total,
      investedAUM,
      sipBook,
      expectedAUM,
      marketValueAUM,
      expectedCommission,
      upcomingBirthdays: birthdaysRes.rows,
      nomineePending: nomineePendingRes.rows[0].count,
      totalFamilies: familiesCountRes.rows[0].count,
      totalSubDistributors: subDistributorsCountRes.rows[0].count,
      internalAumPct, 
      lastUpdated: new Date()
    };
  } catch (err) {
    console.error("❌ buildDashboard Service Error:", err.message);
    throw err;
  }
};