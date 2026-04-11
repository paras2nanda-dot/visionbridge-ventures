import { pool } from "../config/db.js";

export async function buildClientDashboard(clientId) {
  try {
    // 1. 🧑‍💼 FETCH CLIENT PROFILE
    const clientRes = await pool.query(`
      SELECT *, 
        TO_CHAR(created_at, 'DD/MM/YYYY') as since_formatted,
        CASE 
          WHEN dob IS NOT NULL THEN EXTRACT(YEAR FROM AGE(dob)) 
          ELSE NULL 
        END as age
      FROM clients 
      WHERE id = $1`, 
      [clientId]
    );

    if (clientRes.rows.length === 0) throw new Error("Client not found");
    const profile = clientRes.rows[0];

    // 2. 📈 FETCH PORTFOLIO (With Asset Allocation & Individual SIPs)
    const portfolioRes = await pool.query(`
      SELECT 
        mf.scheme_name,
        mf.large_cap, mf.mid_cap, mf.small_cap, mf.debt_allocation, mf.gold_allocation,
        COALESCE(sip.sip_total, 0) as sip_amount,
        txn.net_amount as invested_amount
      FROM (
        SELECT scheme_id, 
               SUM(CASE 
                 WHEN transaction_type IN ('PURCHASE', 'SWITCH_IN') THEN amount 
                 ELSE -amount 
               END) as net_amount
        FROM transactions 
        WHERE client_id = $1
        GROUP BY scheme_id
        HAVING SUM(CASE WHEN transaction_type IN ('PURCHASE', 'SWITCH_IN') THEN amount ELSE -amount END) > 0
      ) txn
      JOIN mf_schemes mf ON txn.scheme_id = mf.id
      LEFT JOIN (
        SELECT scheme_id, SUM(amount) as sip_total 
        FROM sips 
        WHERE client_id = $1 AND is_active = true 
        GROUP BY scheme_id
      ) sip ON mf.id = sip.scheme_id`,
      [clientId]
    );

    // 3. 📊 FETCH SIP SUMMARY (Total Book & Count)
    const sipSummaryRes = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) as total_sip_book, COUNT(*) as sip_count FROM sips WHERE client_id = $1 AND is_active = true",
      [clientId]
    );

    // 4. 🔔 FETCH ALERTS (SIPs ending in next 60 days)
    const alertsRes = await pool.query(
      "SELECT COUNT(*) FROM sips WHERE client_id = $1 AND is_active = true AND end_date <= CURRENT_DATE + INTERVAL '60 days'",
      [clientId]
    );

    // Calculations
    const totalAUM = portfolioRes.rows.reduce((sum, r) => sum + Number(r.invested_amount), 0);
    const summary = {
      totalAUM,
      totalSipBook: Number(sipSummaryRes.rows[0].total_sip_book),
      sipCount: Number(sipSummaryRes.rows[0].sip_count)
    };

    return {
      profile,
      summary,
      alerts: Number(alertsRes.rows[0].count),
      portfolio: portfolioRes.rows.map(r => ({
        ...r,
        percentage: totalAUM > 0 ? ((Number(r.invested_amount) / totalAUM) * 100).toFixed(1) : 0
      }))
    };
    
  } catch (error) {
    console.error("❌ buildClientDashboard Error:", error.message);
    throw error;
  }
}