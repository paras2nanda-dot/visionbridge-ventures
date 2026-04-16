import { pool } from "../config/db.js";

export async function buildClientDashboard(clientId) {
  try {
    // 1. Fetch Client Profile (Keeping your confirmed working Age and Date logic)
    const clientRes = await pool.query(
      `SELECT *, 
        TO_CHAR(created_at, 'DD/MM/YYYY') as since_formatted,
        CASE WHEN dob IS NOT NULL THEN EXTRACT(YEAR FROM AGE(dob)) ELSE NULL END as age 
        FROM clients WHERE id::TEXT = $1`, [clientId]
    );
    if (clientRes.rows.length === 0) throw new Error("Client not found");

    // 2. Fetch Merged Portfolio Logic
    // FIXED: Added dynamic SIP accumulation. It calculates months elapsed since 'start_date' 
    // and multiplies it by the SIP amount to get the true Invested AUM.
    const portfolioRes = await pool.query(`
      WITH all_client_schemes AS (
        SELECT scheme_id FROM transactions WHERE client_id::TEXT = $1
        UNION
        SELECT scheme_id FROM sips WHERE client_id::TEXT = $1 AND (is_active = true OR status = 'Active')
      )
      SELECT 
        mf.scheme_name, mf.large_cap, mf.mid_cap, mf.small_cap, mf.debt_allocation, mf.gold_allocation,
        (COALESCE(txn.net_aum, 0) + COALESCE(sip.accumulated_sip, 0)) as invested_amount,
        COALESCE(sip.sip_total, 0) as sip_amount
      FROM all_client_schemes acs
      JOIN mf_schemes mf ON acs.scheme_id::TEXT = mf.id::TEXT
      LEFT JOIN (
        SELECT scheme_id, 
               SUM(CASE 
                 WHEN UPPER(TRIM(transaction_type)) IN ('PURCHASE', 'SWITCH_IN', 'SWITCH IN') THEN amount 
                 WHEN UPPER(TRIM(transaction_type)) IN ('REDEMPTION', 'SWITCH_OUT', 'SWITCH OUT') THEN -amount 
                 ELSE 0 END) as net_aum
        FROM transactions 
        WHERE client_id::TEXT = $1
        GROUP BY scheme_id
      ) txn ON mf.id::TEXT = txn.scheme_id::TEXT
      LEFT JOIN (
        SELECT scheme_id, 
               SUM(amount) as sip_total,
               SUM(amount * GREATEST(0, (EXTRACT(year FROM age(CURRENT_DATE, COALESCE(start_date, CURRENT_DATE))) * 12) + EXTRACT(month FROM age(CURRENT_DATE, COALESCE(start_date, CURRENT_DATE))) + 1)) as accumulated_sip
        FROM sips 
        WHERE client_id::TEXT = $1 AND (is_active = true OR status = 'Active')
        GROUP BY scheme_id
      ) sip ON mf.id::TEXT = sip.scheme_id::TEXT
      WHERE (COALESCE(txn.net_aum, 0) + COALESCE(sip.accumulated_sip, 0)) != 0 OR COALESCE(sip.sip_total, 0) > 0
    `, [clientId]);

    // 3. Ensure SIP summary also respects both status strings
    const sipRes = await pool.query(
        "SELECT COALESCE(SUM(amount), 0) as total_sip, COUNT(*) as sip_count FROM sips WHERE client_id::TEXT = $1 AND (is_active = true OR status = 'Active')",
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
    console.error("Dashboard Service Error:", error);
    throw error;
  }
}