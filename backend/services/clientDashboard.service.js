/* eslint-disable no-unused-vars */
import { pool } from "../config/db.js";

/**
 * 🧠 HELPER: CALCULATE ACCURATE AUM PER SCHEME
 * Uses the standardized Purchase - Redemption - SIP Missed logic.
 */
async function getSchemeBreakdown(clientId) {
    const query = `
      WITH scheme_txns AS (
          SELECT 
            scheme_id,
            SUM(CASE 
                WHEN LOWER(TRIM(transaction_type)) IN ('purchase', 'switch in', 'switch_in', 'sip installment') THEN amount::NUMERIC 
                WHEN LOWER(TRIM(transaction_type)) IN ('redemption', 'switch out', 'switch_out', 'sip missed') THEN -amount::NUMERIC 
                ELSE 0 END) as net_txn_amt
          FROM transactions 
          WHERE client_id::TEXT = $1::TEXT
          GROUP BY scheme_id
      ),
      scheme_sips AS (
          SELECT 
            scheme_id,
            SUM(amount::NUMERIC) as monthly_amt,
            SUM(amount::NUMERIC * (
                GREATEST(0, (EXTRACT(YEAR FROM AGE(LEAST(CURRENT_DATE, COALESCE(end_date, CURRENT_DATE)), start_date)) * 12 + 
                EXTRACT(MONTH FROM AGE(LEAST(CURRENT_DATE, COALESCE(end_date, CURRENT_DATE)), start_date)) + 1))
            )) as accumulated_est
          FROM sips 
          WHERE client_id::TEXT = $1::TEXT AND LOWER(status) = 'active'
          GROUP BY scheme_id
      )
      SELECT 
        mf.id, mf.scheme_name, mf.large_cap, mf.mid_cap, mf.small_cap, mf.debt_allocation, mf.gold_allocation,
        COALESCE(t.net_txn_amt, 0) + COALESCE(s.accumulated_est, 0) as invested_amount,
        COALESCE(s.monthly_amt, 0) as sip_amount
      FROM mf_schemes mf
      LEFT JOIN scheme_txns t ON mf.id::TEXT = t.scheme_id::TEXT
      LEFT JOIN scheme_sips s ON mf.id::TEXT = s.scheme_id::TEXT
      WHERE (COALESCE(t.net_txn_amt, 0) + COALESCE(s.accumulated_est, 0)) > 0 
         OR COALESCE(s.monthly_amt, 0) > 0
    `;
    const res = await pool.query(query, [clientId]);
    return res.rows;
}

export async function buildClientDashboard(clientId) {
  try {
    // 1. Fetch Primary Client Profile
    const clientRes = await pool.query(
      `SELECT *, 
        TO_CHAR(onboarding_date, 'DD/MM/YYYY') as since_formatted,
        CASE WHEN dob IS NOT NULL THEN EXTRACT(YEAR FROM AGE(dob)) 
             WHEN date_of_birth IS NOT NULL THEN EXTRACT(YEAR FROM AGE(date_of_birth)) 
             ELSE NULL END as age 
       FROM clients WHERE id::TEXT = $1::TEXT`, [clientId]
    );
    if (clientRes.rows.length === 0) throw new Error("Client not found");
    const client = clientRes.rows[0];

    // 2. Build Scheme-by-Scheme Portfolio
    const portfolio = await getSchemeBreakdown(clientId);
    const totalAUM = portfolio.reduce((sum, r) => sum + Number(r.invested_amount), 0);
    const totalSipBook = portfolio.reduce((sum, r) => sum + Number(r.sip_amount), 0);

    // 3. Fetch Family Members (If grouped)
    let familyMembers = [];
    if (client.family_id) {
        const membersRes = await pool.query(
            `SELECT id, full_name, family_role, nominee_name, dob, date_of_birth 
             FROM clients WHERE family_id = $1 AND id::TEXT != $2::TEXT`, 
            [client.family_id, clientId]
        );
        
        // Add current AUM summary for each family member
        for (let member of membersRes.rows) {
            const mPortfolio = await getSchemeBreakdown(member.id);
            familyMembers.push({
                ...member,
                age: member.dob || member.date_of_birth ? Math.floor((new Date() - new Date(member.dob || member.date_of_birth)) / 31557600000) : 'N/A',
                summary: {
                    totalAUM: mPortfolio.reduce((sum, r) => sum + Number(r.invested_amount), 0),
                    totalSIP: mPortfolio.reduce((sum, r) => sum + Number(r.sip_amount), 0)
                },
                portfolio: mPortfolio
            });
        }
    }

    // 4. Fetch Interaction History (Review Logs)
    const reviewHistory = await pool.query(
        `SELECT * FROM review_logs 
         WHERE entity_type = 'CLIENT' AND entity_id::TEXT = $1::TEXT 
         ORDER BY review_date DESC LIMIT 5`, 
        [clientId]
    );

    return {
      profile: client,
      summary: {
        totalAUM,
        totalSipBook,
        sipCount: portfolio.filter(r => Number(r.sip_amount) > 0).length
      },
      portfolio: portfolio.map(r => ({
        ...r,
        percentage: totalAUM > 0 ? ((Number(r.invested_amount) / totalAUM) * 100).toFixed(1) : 0
      })),
      familyMembers,
      review_history: reviewHistory.rows
    };
  } catch (error) {
    console.error("❌ buildClientDashboard Service Error:", error.message);
    throw error;
  }
}