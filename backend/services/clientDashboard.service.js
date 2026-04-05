import pool from "../config/db.js";

export async function buildClientDashboard(clientId) {
  try {
    const clientRes = await pool.query(
      "SELECT * FROM clients WHERE id = $1 AND is_active = true", [clientId]
    );
    if (clientRes.rows.length === 0) throw new Error("Client not found");

    const portfolioRes = await pool.query(`
      SELECT 
        scheme_name,
        SUM(CASE 
          WHEN transaction_type IN ('PURCHASE','SWITCH_IN') THEN amount 
          WHEN transaction_type IN ('REDEMPTION','SWITCH_OUT') THEN -amount 
          ELSE 0 END) as invested_amount
      FROM transactions WHERE client_id = $1
      GROUP BY scheme_name HAVING SUM(amount) > 0
    `, [clientId]);

    const totalAUM = portfolioRes.rows.reduce((sum, r) => sum + Number(r.invested_amount), 0);

    return {
      client: clientRes.rows[0],
      totalAUM,
      portfolio: portfolioRes.rows.map(r => ({
        ...r,
        percentage: totalAUM > 0 ? ((r.invested_amount / totalAUM) * 100).toFixed(2) : 0
      }))
    };
  } catch (error) {
    console.error("Client Dashboard Error:", error);
    throw error;
  }
}