import { pool } from '../config/db.js';
import { logActivity } from './activityController.js';

/**
 * 🧾 NEW: PREVIEW INVOICE DATA
 * Calculates txn count, client count, and previous balance before saving.
 */
export const getInvoicePreview = async (req, res) => {
    const { id } = req.params; // Sub-Distributor ID
    const { startDate, endDate } = req.query;

    try {
        // 1. Calculate Duration (Month Factor)
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const monthFactor = parseFloat((diffDays / 30).toFixed(2));

        // 2. Count Total Active Clients for this SD
        const clientCountRes = await pool.query(
            'SELECT COUNT(*) FROM clients WHERE sub_distributor_id = $1',
            [id]
        );

        // 3. Count Transactions in this period for this SD's clients
        // Counts SIP installments + Lumpsums + Switches
        const txnCountRes = await pool.query(`
            SELECT COUNT(*) FROM transactions t
            JOIN clients c ON t.client_id::TEXT = c.id::TEXT
            WHERE c.sub_distributor_id = $1 
            AND t.date BETWEEN $2 AND $3`,
            [id, startDate, endDate]
        );

        // 4. Carryforward Logic: Find total unpaid balance from previous invoices
        const balanceRes = await pool.query(`
            SELECT COALESCE(SUM(net_payout), 0) as balance 
            FROM sub_distributor_invoices 
            WHERE sub_distributor_id = $1 AND status != 'Paid'`,
            [id]
        );

        res.json({
            success: true,
            data: {
                clientCount: parseInt(clientCountRes.rows[0].count),
                txnCount: parseInt(txnCountRes.rows[0].count),
                previousBalance: parseFloat(balanceRes.rows[0].balance),
                monthFactor: monthFactor || 1.0
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * 🧾 NEW: GENERATE & SAVE INVOICE
 */
export const createInvoice = async (req, res) => {
    const { 
        sub_distributor_id, invoice_no, start_date, end_date, slab_name,
        gross_commission, platform_applicable, txn_count, txn_rate,
        ops_applicable, client_count, ops_rate_pm, duration_months,
        tds_applicable, tds_rate_percent, previous_balance, net_payout 
    } = req.body;
    
    const username = req.user?.username || "System";

    try {
        const query = `
            INSERT INTO sub_distributor_invoices (
                invoice_no, sub_distributor_id, start_date, end_date, slab_name,
                gross_commission, platform_applicable, txn_count, txn_rate,
                ops_applicable, client_count, ops_rate_pm, duration_months,
                tds_applicable, tds_rate_percent, previous_balance, net_payout, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'Unpaid')
            RETURNING *`;

        const values = [
            invoice_no, sub_distributor_id, start_date, end_date, slab_name,
            gross_commission, platform_applicable, txn_count, txn_rate,
            ops_applicable, client_count, ops_rate_pm, duration_months,
            tds_applicable, tds_rate_percent, previous_balance, net_payout
        ];

        const result = await pool.query(query, values);
        
        await logActivity(username, 'CREATE', invoice_no, `📄 Generated invoice ${invoice_no} for partner ID: ${sub_distributor_id}`);

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

/**
 * 🧾 NEW: UPDATE INVOICE STATUS (Mark as Paid)
 */
export const updateInvoiceStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Paid' or 'Unpaid'
    const username = req.user?.username || "System";

    try {
        const result = await pool.query(
            'UPDATE sub_distributor_invoices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );

        await logActivity(username, 'UPDATE', result.rows[0].invoice_no, `💰 Invoice ${result.rows[0].invoice_no} marked as ${status}`);

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * 🧾 NEW: FETCH INVOICE HISTORY
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
 * 📈 EXISTING: GET PERFORMANCE STATS & CLIENT LIST
 */
export const getSubDistributorPerformance = async (req, res) => {
    const { id } = req.params;
    try {
        const statsQuery = `
            WITH partner_clients AS (
                SELECT id FROM clients WHERE sub_distributor_id = $1
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
                            ELSE 0 END) * 
                        ((COALESCE(m.commission_rate, 0.8) / 100) * (sd.split_percentage / 100)) / 12
                    ), 0) as monthly_payout
                FROM transactions t
                JOIN partner_clients pc ON t.client_id::TEXT = pc.id::TEXT
                JOIN mf_schemes m ON t.scheme_id::TEXT = m.id::TEXT
                CROSS JOIN sub_distributors sd WHERE sd.id = $1
            ),
            sip_performance AS (
                SELECT 
                    COALESCE(SUM(s.amount::NUMERIC), 0) as monthly_sip_book
                FROM sips s
                JOIN partner_clients pc ON s.client_id::TEXT = pc.id::TEXT
                WHERE LOWER(s.status) = 'active'
            )
            SELECT 
                p.*, 
                sp.monthly_sip_book 
            FROM performance p, sip_performance sp`;

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
            WHERE c.sub_distributor_id = $1
            ORDER BY client_invested_aum DESC`;
        
        const clientsResult = await pool.query(clientsQuery, [id]);

        res.json({
            stats: statsResult.rows[0],
            clients: clientsResult.rows
        });
    } catch (err) {
        console.error("Performance Calculation Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// --- EXISTING CRUD LOGIC PRESERVED ---

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
            VALUES ($1, $2, $3, $4)
            RETURNING *`;
        const values = [name, code, location, split_percentage || 90.00];
        
        const result = await pool.query(query, values);
        const newDistributor = result.rows[0];

        await logActivity(
            username,
            'CREATE',
            newDistributor.name,
            `🤝 Registered new sub-distributor: ${newDistributor.name} (${newDistributor.code}) with ${newDistributor.split_percentage}% split.`,
            null,
            newDistributor
        );

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
        if (oldRes.rows.length === 0) return res.status(404).json({ error: "Partner not found" });
        const oldData = oldRes.rows[0];

        const query = `
            UPDATE sub_distributors 
            SET name=$1, code=$2, location=$3, split_percentage=$4 
            WHERE id=$5 RETURNING *`;
        const values = [name, code, location, split_percentage, id];

        const result = await pool.query(query, values);
        const newData = result.rows[0];

        await logActivity(username, 'UPDATE', newData.name, `Updated details for partner ${newData.name}.`, oldData, newData);

        res.json(newData);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const deleteSubDistributor = async (req, res) => {
    const { id } = req.params;
    const username = req.user?.username || "System";
    try {
        const check = await pool.query('SELECT * FROM sub_distributors WHERE id = $1', [id]);
        if (check.rows.length === 0) return res.status(404).json({ error: "Not found" });
        
        await pool.query('DELETE FROM sub_distributors WHERE id = $1', [id]);

        await logActivity(
            username,
            'DELETE',
            check.rows[0].name,
            `🗑️ Partner ${check.rows[0].name} removed from system.`,
            check.rows[0],
            null
        );

        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};