/* eslint-disable no-unused-vars */
import { pool } from '../config/db.js';
import { logActivity } from './activityController.js';

/**
 * 🧾 AUTOMATED INVOICE PREVIEW ENGINE
 * Route: GET /api/sub-distributors/:id/invoice-preview
 * Dynamically reconciles multi-page invoice metrics using exact Excel manual criteria.
 */
export const getInvoicePreview = async (req, res) => {
    const { id } = req.params; 
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ success: false, error: "Billing timeline dates are required." });
    }

    try {
        // 1. Fetch Default Partner Split Contract Allocation Percentage
        const partnerRes = await pool.query('SELECT split_percentage FROM sub_distributors WHERE id = $1', [id]);
        if (partnerRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Partner entry not found." });
        }
        const defaultSplit = parseFloat(partnerRes.rows[0].split_percentage || 90.00);

        // 2. Calculate Precise Duration (Month Factor)
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const monthFactor = parseFloat(Math.max(1.0, (diffDays / 30)).toFixed(2));

        // 3. Count Total Active Mapped Clients Matured Before/During the Period
        const clientCountRes = await pool.query(
            'SELECT COUNT(*)::INT FROM clients WHERE sub_distributor_id::TEXT = $1::TEXT AND is_active = true AND onboarding_date <= $2::DATE',
            [id, endDate]
        );

        // 4. Count Platforms Volumes (Purchases and SIP Installments executed inside the month window)
        const txnCountRes = await pool.query(`
            SELECT COUNT(*)::INT FROM transactions t
            JOIN clients c ON t.client_id::TEXT = c.id::TEXT
            WHERE c.sub_distributor_id::TEXT = $1::TEXT 
            AND t.transaction_date::DATE BETWEEN $2::DATE AND $3::DATE
            AND LOWER(TRIM(t.transaction_type)) IN ('purchase', 'sip installment')`,
            [id, startDate, endDate]
        );

        // 5. Carryforward Logic: Find total unpaid arrears balance from previous invoices
        const balanceRes = await pool.query(`
            SELECT COALESCE(SUM(net_payout), 0)::NUMERIC as balance 
            FROM sub_distributor_invoices 
            WHERE sub_distributor_id::TEXT = $1::TEXT AND LOWER(status) != 'paid'`,
            [id]
        );

        /**
         * 6. PAGE 2 METRIC ALLOCATION LOGIC (Client-by-Client, Scheme-by-Scheme positions)
         * Extracts Opening Assets (prior transactions), subtracts monthly Redemptions,
         * and matches against the live AMC master rate to form gross commission baselines.
         */
        const ledgerQuery = `
            WITH client_scheme_txns AS (
                SELECT 
                    c.full_name AS client_name,
                    c.client_code,
                    t.scheme_name,
                    -- Cumulative position balance before the opening billing timestamp
                    SUM(CASE 
                        WHEN t.transaction_date::DATE < $2::DATE AND LOWER(TRIM(t.transaction_type)) IN ('purchase', 'switch in', 'switch_in', 'sip installment') THEN t.amount::NUMERIC
                        WHEN t.transaction_date::DATE < $2::DATE AND LOWER(TRIM(t.transaction_type)) IN ('redemption', 'switch out', 'switch_out', 'sip missed') THEN -t.amount::NUMERIC
                        ELSE 0 END) AS opening_bal,
                    -- Liquidations running exclusively inside this bill window
                    SUM(CASE 
                        WHEN t.transaction_date::DATE BETWEEN $2::DATE AND $3::DATE AND LOWER(TRIM(t.transaction_type)) IN ('redemption', 'switch out', 'switch_out') THEN t.amount::NUMERIC
                        ELSE 0 END) AS monthly_redemptions
                FROM transactions t
                JOIN clients c ON t.client_id::TEXT = c.id::TEXT
                WHERE c.sub_distributor_id::TEXT = $1::TEXT
                GROUP BY c.full_name, c.client_code, t.scheme_name
            )
            SELECT 
                cst.client_name,
                cst.client_code,
                cst.scheme_name,
                COALESCE(cst.opening_bal, 0)::NUMERIC AS opening_balance,
                COALESCE(cst.monthly_redemptions, 0)::NUMERIC AS redemptions,
                GREATEST(0, COALESCE(cst.opening_bal, 0) - COALESCE(cst.monthly_redemptions, 0))::NUMERIC AS eligible_investment,
                COALESCE(m.commission_rate, 0.80)::NUMERIC AS commission_rate
            FROM client_scheme_txns cst
            LEFT JOIN mf_schemes m ON LOWER(TRIM(m.scheme_name)) = LOWER(TRIM(cst.scheme_name))
            WHERE cst.opening_bal > 0
            ORDER BY cst.client_name ASC, cst.scheme_name ASC;
        `;

        const ledgerResult = await pool.query(ledgerQuery, [id, startDate, endDate]);

        // 7. Loop allocations using default contract multiplier split to formulate baseline totals
        let totalGrossCommission = 0;
        const processedSchemesTable = ledgerResult.rows.map(row => {
            const eligible = parseFloat(row.eligible_investment);
            const rate = parseFloat(row.commission_rate) / 100;
            // Baseline calculation: (Eligible Principal * Rate) / 12 * Partner Split Ratio
            const grossShare = ((eligible * rate) / 12) * (defaultSplit / 100);
            totalGrossCommission += grossShare;

            return {
                client_name: row.client_name,
                client_code: row.client_code,
                scheme_name: row.scheme_name,
                opening_balance: parseFloat(row.opening_balance),
                redemptions: parseFloat(row.redemptions),
                eligible_investment: eligible,
                commission_rate: parseFloat(row.commission_rate),
                calculated_commission: parseFloat(grossShare.toFixed(2))
            };
        });

        res.json({
            success: true,
            data: {
                clientCount: parseInt(clientCountRes.rows[0].count || 0),
                txnCount: parseInt(txnCountRes.rows[0].count || 0),
                previousBalance: parseFloat(balanceRes.rows[0].balance || 0),
                monthFactor: monthFactor || 1.0,
                sharingPercentage: defaultSplit,
                grossCommission: parseFloat(totalGrossCommission.toFixed(2)),
                schemesTable: processedSchemesTable
            }
        });
    } catch (err) {
        console.error("❌ getInvoicePreview Runtime Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * 🧾 AUTOMATED GENERATE & SAVE MULTI-PAGE INVOICE
 */
export const createInvoice = async (req, res) => {
    const { 
        sub_distributor_id, invoice_no, start_date, end_date, slab_name,
        gross_commission, platform_applicable, txn_count, txn_rate,
        ops_applicable, client_count, ops_rate_pm, duration_months,
        tds_applicable, tds_rate_percent, previous_balance, net_payout,
        sharing_percentage, schemesTable 
    } = req.body;
    
    const username = req.user?.username || "System";

    try {
        // Enforce atomic database transactions
        await pool.query('BEGIN');

        // 1. Log structural variables into master header record
        const masterQuery = `
            INSERT INTO sub_distributor_invoices (
                invoice_no, sub_distributor_id, start_date, end_date, slab_name,
                gross_commission, platform_applicable, txn_count, txn_rate,
                ops_applicable, client_count, ops_rate_pm, duration_months,
                tds_applicable, tds_rate_percent, previous_balance, net_payout, 
                sharing_percentage, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'Unpaid')
            RETURNING id, invoice_no;
        `;

        const masterValues = [
            invoice_no, sub_distributor_id, start_date, end_date, slab_name,
            gross_commission, platform_applicable, txn_count, txn_rate,
            ops_applicable, client_count, ops_rate_pm, duration_months,
            tds_applicable, tds_rate_percent, previous_balance, net_payout,
            sharing_percentage || 90.00
        ];

        const masterResult = await pool.query(masterQuery, masterValues);
        const invoiceId = masterResult.rows[0].id;

        // 2. Persist individual asset records into the itemized child table for reprint accuracy
        if (schemesTable && schemesTable.length > 0) {
            const itemInsertQuery = `
                INSERT INTO sub_distributor_invoice_items (
                    invoice_id, client_name, client_code, scheme_name, 
                    opening_balance, redemptions, eligible_investment, 
                    commission_rate, calculated_commission
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
            `;

            for (const item of schemesTable) {
                await pool.query(itemInsertQuery, [
                    invoiceId, item.client_name, item.client_code, item.scheme_name,
                    item.opening_balance, item.redemptions, item.eligible_investment,
                    item.commission_rate, item.calculated_commission
                ]);
            }
        }
        
        await pool.query('COMMIT');
        await logActivity(username, 'CREATE', invoice_no, `📄 Automated billing locked & saved for invoice ${invoice_no}`);

        res.status(201).json({ success: true, data: masterResult.rows[0] });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error("❌ createInvoice Transaction Error:", err.message);
        res.status(400).json({ success: false, error: err.message });
    }
};

/**
 * 🧾 UPDATE INVOICE RECORD
 */
export const updateInvoice = async (req, res) => {
    const { id } = req.params;
    const { 
        start_date, end_date, slab_name, gross_commission, 
        platform_applicable, txn_count, txn_rate,
        ops_applicable, client_count, ops_rate_pm, duration_months,
        tds_applicable, tds_rate_percent, previous_balance, net_payout,
        sharing_percentage, schemesTable 
    } = req.body;
    
    const username = req.user?.username || "System";

    try {
        await pool.query('BEGIN');

        const masterUpdateQuery = `
            UPDATE sub_distributor_invoices SET
                start_date = $1, end_date = $2, slab_name = $3, gross_commission = $4, 
                platform_applicable = $5, txn_count = $6, txn_rate = $7, ops_applicable = $8, 
                client_count = $9, ops_rate_pm = $10, duration_months = $11, tds_applicable = $12, 
                tds_rate_percent = $13, previous_balance = $14, net_payout = $15, sharing_percentage = $16
            WHERE id = $17 RETURNING *`;
        
        const masterValues = [
            start_date, end_date, slab_name, gross_commission, 
            platform_applicable, txn_count, txn_rate, ops_applicable, 
            client_count, ops_rate_pm, duration_months, tds_applicable, 
            tds_rate_percent, previous_balance, net_payout, sharing_percentage, id
        ];

        const result = await pool.query(masterUpdateQuery, masterValues);
        if (result.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ success: false, error: "Invoice ledger entry not found." });
        }

        // Wipe old itemizations and refresh line allocations
        await pool.query('DELETE FROM sub_distributor_invoice_items WHERE invoice_id = $1', [id]);

        if (schemesTable && schemesTable.length > 0) {
            const itemInsertQuery = `
                INSERT INTO sub_distributor_invoice_items (
                    invoice_id, client_name, client_code, scheme_name, 
                    opening_balance, redemptions, eligible_investment, 
                    commission_rate, calculated_commission
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
            `;
            for (const item of schemesTable) {
                await pool.query(itemInsertQuery, [
                    id, item.client_name, item.client_code, item.scheme_name,
                    item.opening_balance, item.redemptions, item.eligible_investment,
                    item.commission_rate, item.calculated_commission
                ]);
            }
        }

        await pool.query('COMMIT');
        await logActivity(username, 'UPDATE', result.rows[0].invoice_no, `📄 Modified adjustment values for invoice ${result.rows[0].invoice_no}`);

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error("❌ updateInvoice Transaction Error:", err.message);
        res.status(400).json({ success: false, error: err.message });
    }
};

/**
 * 🧾 REMOVE INVOICE DATA SET
 */
export const deleteInvoice = async (req, res) => {
    const { id } = req.params;
    const username = req.user?.username || "System";

    try {
        const check = await pool.query('SELECT invoice_no FROM sub_distributor_invoices WHERE id = $1', [id]);
        if (check.rows.length === 0) return res.status(404).json({ success: false, error: "Invoice ledger entry not found" });

        await pool.query('DELETE FROM sub_distributor_invoices WHERE id = $1', [id]);
        await logActivity(username, 'DELETE', check.rows[0].invoice_no, `🗑️ Purged invoice entry ${check.rows[0].invoice_no} from core registers`);

        res.json({ success: true, message: 'Invoice deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * 🧾 RECORD DISBURSEMENT DISPATCH STATUS (Mark as Paid)
 */
export const updateInvoiceStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; 
    const username = req.user?.username || "System";

    try {
        const result = await pool.query(
            'UPDATE sub_distributor_invoices SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Invoice entry not found" });
        }

        await logActivity(username, 'UPDATE', result.rows[0].invoice_no, `💰 Invoice ${result.rows[0].invoice_no} marked status as ${status}`);
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * 🧾 FETCH HISTORICAL INVOICES REGISTER
 */
export const getInvoices = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT i.*, sd.name as sd_name 
            FROM sub_distributor_invoices i
            JOIN sub_distributors sd ON i.sub_distributor_id = sd.id
            ORDER BY i.created_at DESC`);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * 📈 CORE PARTNER PROFILE SUMMARY ENGINE
 */
export const getSubDistributorPerformance = async (req, res) => {
    const { id } = req.params;
    try {
        const statsQuery = `
            WITH partner_clients AS (
                SELECT id FROM clients WHERE sub_distributor_id = $1 AND is_active = true
            ),
            performance AS (
                SELECT 
                    COALESCE(SUM(CASE 
                        WHEN LOWER(TRIM(t.transaction_type)) IN ('purchase', 'switch in', 'switch_in') THEN t.amount::NUMERIC 
                        WHEN LOWER(TRIM(t.transaction_type)) IN ('redemption', 'switch out', 'switch_out') THEN -t.amount::NUMERIC 
                        ELSE 0 END), 0) as invested_aum,
                    COALESCE(SUM(
                        (CASE 
                            WHEN LOWER(TRIM(t.transaction_type)) IN ('purchase', 'switch in', 'switch_in') THEN t.amount::NUMERIC 
                            WHEN LOWER(TRIM(t.transaction_type)) IN ('redemption', 'switch out', 'switch_out') THEN -t.amount::NUMERIC 
                            ELSE 0 END) * ((COALESCE(m.commission_rate, 0.8) / 100) * (sd.split_percentage / 100)) / 12
                    ), 0) as monthly_payout
                FROM transactions t
                JOIN partner_clients pc ON t.client_id::TEXT = pc.id::TEXT
                JOIN mf_schemes m ON t.scheme_name = m.scheme_name
                CROSS JOIN sub_distributors sd WHERE sd.id = $1
            ),
            sip_performance AS (
                SELECT 
                    COALESCE(SUM(s.amount::NUMERIC), 0) as monthly_sip_book
                FROM sips s
                JOIN partner_clients pc ON s.client_id::TEXT = pc.id::TEXT
                WHERE LOWER(s.status) = 'active'
            )
            SELECT p.*, sp.monthly_sip_book FROM performance p, sip_performance sp`;

        const statsResult = await pool.query(statsQuery, [id]);
        
        const clientsQuery = `
            SELECT 
                c.full_name, 
                c.client_code, 
                c.mobile_number,
                COALESCE((
                    SELECT SUM(CASE 
                        WHEN LOWER(TRIM(transaction_type)) IN ('purchase', 'switch in', 'switch_in') THEN amount::NUMERIC 
                        WHEN LOWER(TRIM(transaction_type)) IN ('redemption', 'switch out', 'switch_out') THEN -amount::NUMERIC 
                        ELSE 0 END) 
                    FROM transactions WHERE client_id::TEXT = c.id::TEXT
                ), 0) as client_invested_aum
            FROM clients c
            WHERE c.sub_distributor_id = $1 AND c.is_active = true
            ORDER BY client_invested_aum DESC`;
        
        const clientsResult = await pool.query(clientsQuery, [id]);

        res.json({
            stats: statsResult.rows[0],
            clients: clientsResult.rows
        });
    } catch (err) {
        console.error("❌ getSubDistributorPerformance Runtime Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

/**
 * 🤝 PARTNER DIRECTORY STANDARD CRUD ROUTINES
 */
export const getSubDistributors = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM sub_distributors ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createSubDistributor = async (req, res) => {
    const { name, code, location, split_percentage } = req.body;
    const username = req.user?.username || "System";
    try {
        const query = `
            INSERT INTO sub_distributors (name, code, location, split_percentage)
            VALUES ($1, $2, $3, $4) RETURNING *`;
        const values = [name, code, location, split_percentage || 90.00];
        
        const result = await pool.query(query, values);
        const newDistributor = result.rows[0];

        await logActivity(username, 'CREATE', newDistributor.name, `🤝 Registered new partner node: ${newDistributor.name} (${newDistributor.code})`);
        res.status(201).json(newDistributor);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const updateSubDistributor = async (req, res) => {
    const { id } = req.params;
    const { name, code, location, split_percentage } = req.body;
    const username = req.user?.username || "System";

    try {
        const oldRes = await pool.query('SELECT * FROM sub_distributors WHERE id = $1', [id]);
        if (oldRes.rows.length === 0) return res.status(404).json({ error: "Partner entry not found." });

        const query = `
            UPDATE sub_distributors SET name=$1, code=$2, location=$3, split_percentage=$4 
            WHERE id=$5 RETURNING *`;
        const result = await pool.query(query, [name, code, location, split_percentage, id]);

        await logActivity(username, 'UPDATE', name, `Updated profile fields for partner node: ${name}`);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const deleteSubDistributor = async (req, res) => {
    const { id } = req.params;
    const username = req.user?.username || "System";
    try {
        const check = await pool.query('SELECT name FROM sub_distributors WHERE id = $1', [id]);
        if (check.rows.length === 0) return res.status(404).json({ error: "Partner node missing" });
        
        await pool.query('DELETE FROM sub_distributors WHERE id = $1', [id]);
        await logActivity(username, 'DELETE', check.rows[0].name, `🗑️ Removed partner channel node: ${check.rows[0].name}`);

        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};