import { pool } from "../config/db.js";

export async function buildClientDashboard(clientId) {
  try {
    // 1. Fetch Client Profile with Age Calculation
    const clientRes = await pool.query(
      `SELECT *, 
       TO_CHAR(created_at, 'DD/MM/YYYY') as since_formatted,
       CASE 
         WHEN dob IS NOT NULL THEN EXTRACT(YEAR FROM AGE(dob)) 
         ELSE NULL 
       END as age 
       FROM clients WHERE id::TEXT = $1`, 
      [clientId]
    );
    
    if (clientRes.rows.length === 0) throw new Error("Client not found");

    // 2. Fetch Portfolio with net invested amount and scheme data
    const portfolioRes = await pool.query(`
      SELECT 
        mf.scheme_name,
        mf.large_cap, mf.mid_cap, mf.small_cap, mf.debt_allocation, mf.gold_allocation,
        SUM(CASE 
          WHEN t.transaction_type IN ('PURCHASE','SWITCH_IN') THEN t.amount 
          WHEN t.transaction_type IN ('REDEMPTION','SWITCH_OUT') THEN -t.amount 
          ELSE 0 END) as invested_amount,
        COALESCE(sip.sip_total, 0) as sip_amount
      FROM transactions t
      JOIN mf_schemes mf ON t.scheme_id::TEXT = mf.id::TEXT
      LEFT JOIN (
        SELECT scheme_id, SUM(amount) as sip_total 
        FROM sips 
        WHERE client_id::TEXT = $1 AND is_active = true 
        GROUP BY scheme_id
      ) sip ON mf.id::TEXT = sip.scheme_id::TEXT
      WHERE t.client_id::TEXT = $1
      GROUP BY mf.id, mf.scheme_name, mf.large_cap, mf.mid_cap, mf.small_cap, mf.debt_allocation, mf.gold_allocation, sip.sip_total
      HAVING SUM(CASE WHEN t.transaction_type IN ('PURCHASE','SWITCH_IN') THEN t.amount WHEN t.transaction_type IN ('REDEMPTION','SWITCH_OUT') THEN -t.amount ELSE 0 END) > 0
    `, [clientId]);

    // 3. Fetch SIP Summary
    const sipRes = await pool.query(
        "SELECT COALESCE(SUM(amount), 0) as total_sip, COUNT(*) as sip_count FROM sips WHERE client_id::TEXT = $1 AND is_active = true",
        [clientId]
    );

    const totalAUM = portfolioRes.rows.reduce((sum, r) => sum + Number(r.invested_amount), 0);

    return {
      profile: clientRes.rows[0],
      summary: {
        totalAUM,
        totalSipBook: Number(sipRes.rows[0].total_sip),
        sipCount: Number(sipRes.rows[0].sip_count)
      },
      portfolio: portfolioRes.rows.map(r => ({
        ...r,
        percentage: totalAUM > 0 ? ((Number(r.invested_amount) / totalAUM) * 100).toFixed(1) : 0
      })),
      alerts: 0
    };
  } catch (error) {
    console.error("Client Dashboard Service Error:", error);
    throw error;
  }
}