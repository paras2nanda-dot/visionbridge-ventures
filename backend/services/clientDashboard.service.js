import { pool } from "../config/db.js";

export async function buildClientDashboard(clientId) {
  try {
    // Fetch Client with formatting for "Since" date
    const clientRes = await pool.query(
      "SELECT *, TO_CHAR(created_at, 'DD/MM/YYYY') as since_formatted FROM clients WHERE id = $1 AND is_active = true", [clientId]
    );
    if (clientRes.rows.length === 0) throw new Error("Client not found");

    const portfolioRes = await pool.query(`
      SELECT 
        mf.scheme_name,
        mf.large_cap, mf.mid_cap, mf.small_cap, mf.debt_allocation, mf.gold_allocation,
        SUM(CASE 
          WHEN t.transaction_type IN ('PURCHASE','SWITCH_IN') THEN t.amount 
          WHEN t.transaction_type IN ('REDEMPTION','SWITCH_OUT') THEN -t.amount 
          ELSE 0 END) as invested_amount
      FROM transactions t
      JOIN mf_schemes mf ON t.scheme_id = mf.id
      WHERE t.client_id = $1
      GROUP BY mf.id, mf.scheme_name HAVING SUM(t.amount) > 0
    `, [clientId]);

    const sipRes = await pool.query(
        "SELECT COALESCE(SUM(amount), 0) as total_sip, COUNT(*) as sip_count FROM sips WHERE client_id = $1 AND is_active = true",
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
    console.error("Client Dashboard Error:", error);
    throw error;
  }
}