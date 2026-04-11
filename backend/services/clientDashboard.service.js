import { pool } from "../config/db.js";

export async function buildClientDashboard(clientId) {
  try {
    // 1. Fetch Client Profile (Keeping your is_active = true check)
    // Added: age calculation and since_formatted
    const clientRes = await pool.query(
      `SELECT *, 
       TO_CHAR(created_at, 'DD/MM/YYYY') as since_formatted,
       CASE WHEN dob IS NOT NULL THEN EXTRACT(YEAR FROM AGE(dob)) ELSE NULL END as age 
       FROM clients WHERE id::TEXT = $1 AND is_active = true`, 
      [clientId]
    );
    
    if (clientRes.rows.length === 0) throw new Error("Client not found");

    // 2. Fetch Portfolio (Using your original SUM logic with added scheme details)
    const portfolioRes = await pool.query(`
      SELECT 
        mf.scheme_name, mf.large_cap, mf.mid_cap, mf.small_cap, mf.debt_allocation, mf.gold_allocation,
        SUM(CASE 
          WHEN t.transaction_type IN ('PURCHASE','SWITCH_IN') THEN t.amount 
          WHEN t.transaction_type IN ('REDEMPTION','SWITCH_OUT') THEN -t.amount 
          ELSE 0 END) as invested_amount,
        (SELECT SUM(amount) FROM sips WHERE client_id::TEXT = $1 AND scheme_id = mf.id AND is_active = true) as sip_amount
      FROM transactions t
      JOIN mf_schemes mf ON t.scheme_id::TEXT = mf.id::TEXT
      WHERE t.client_id::TEXT = $1
      GROUP BY mf.id, mf.scheme_name, mf.large_cap, mf.mid_cap, mf.small_cap, mf.debt_allocation, mf.gold_allocation
      HAVING SUM(CASE WHEN t.transaction_type IN ('PURCHASE','SWITCH_IN') THEN t.amount ELSE -t.amount END) > 0
    `, [clientId]);

    // 3. Fetch SIP Summary (Total book and count)
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
        percentage: totalAUM > 0 ? ((Number(r.invested_amount) / totalAUM) * 100).toFixed(2) : 0
      })),
      alerts: 0
    };
  } catch (error) {
    console.error("Client Dashboard Service Error:", error);
    throw error;
  }
}