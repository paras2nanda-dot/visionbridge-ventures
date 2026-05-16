import { pool } from "../config/db.js";

export const MathService = {
    /**
     * 🧠 ACCURATE AUM CALCULATION
     * Formula: (Historical Purchases) - (Redemptions) - (SIP Missed Entries)
     */
    calculateInvestedAUM: async (clientId = null) => {
        const query = `
            WITH txn_sums AS (
                SELECT 
                    SUM(CASE 
                        WHEN LOWER(TRIM(transaction_type)) IN ('purchase', 'switch in', 'switch_in', 'sip installment') THEN amount::NUMERIC 
                        WHEN LOWER(TRIM(transaction_type)) IN ('redemption', 'switch out', 'switch_out', 'sip missed') THEN -amount::NUMERIC 
                        ELSE 0 END) as net_amt
                FROM transactions
                ${clientId ? 'WHERE client_id::TEXT = $1::TEXT' : ''}
            ),
            sip_sums AS (
                SELECT 
                    SUM(amount::NUMERIC * (
                        GREATEST(0, (EXTRACT(YEAR FROM AGE(
                            LEAST(CURRENT_DATE, COALESCE(end_date, CURRENT_DATE)), 
                            start_date
                        )) * 12 + EXTRACT(MONTH FROM AGE(
                            LEAST(CURRENT_DATE, COALESCE(end_date, CURRENT_DATE)), 
                            start_date
                        )) + 1))
                    )) as sip_est
                FROM sips 
                WHERE LOWER(status) = 'active'
                ${clientId ? 'AND client_id::TEXT = $1::TEXT' : ''}
            )
            SELECT (COALESCE(t.net_amt, 0) + COALESCE(s.sip_est, 0)) as total 
            FROM txn_sums t, sip_sums s
        `;
        const params = clientId ? [clientId] : [];
        const result = await pool.query(query, params);
        return parseFloat(result.rows[0].total || 0);
    },

    /**
     * 📊 MONTHLY REVENUE CALCULATION
     * Centralized to prevent "math drift" across different pages.
     */
    getMonthlyCommission: async () => {
        const query = `SELECT SUM(total_current_value * (COALESCE(commission_rate, 0.8) / 100) / 12) as monthly FROM mf_schemes`;
        const res = await pool.query(query);
        return parseFloat(res.rows[0].monthly || 0);
    }
};