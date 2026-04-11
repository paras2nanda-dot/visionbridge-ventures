import { pool } from "../config/db.js";

export async function buildClientDashboard(clientId) {
  try {
    // 1. Fetch Client Profile
    const clientRes = await pool.query(
      "SELECT *, TO_CHAR(created_at, 'DD/MM/YYYY') as since_formatted FROM clients WHERE id = $1 AND is_active = true", 
      [clientId]
    );
    if (clientRes.rows.length === 0) throw new Error("Client not found");

    // 2. Fetch Portfolio & SIP Totals
    const portfolioRes = await pool.query(`
      SELECT 
        scheme_name,
        SUM(CASE 
          WHEN transaction_type IN ('PURCHASE','SWITCH_IN') THEN amount 
          WHEN transaction_type IN ('REDEMPTION','SWITCH_OUT') THEN -amount 
          ELSE 0 END) as invested_amount
      FROM transactions 
      WHERE client_id = $1
      GROUP BY scheme_name 
      HAVING SUM(CASE WHEN transaction_type IN ('PURCHASE','SWITCH_IN') THEN amount ELSE -amount END) > 0
    `, [clientId]);

    const sipRes = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) as total_sip, COUNT(*) as sip_count FROM sips WHERE client_id = $1 AND is_active = true",
      [clientId]
    );

    const totalAUM = portfolioRes.rows.reduce((sum, r) => sum + Number(r.invested_amount), 0);

    // 🛡️ MAPPED RETURN: Matches your Frontend keys exactly
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