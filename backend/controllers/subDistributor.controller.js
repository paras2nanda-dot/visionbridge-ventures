import { pool } from '../config/db.js';
import { logActivity } from './activityController.js';

/**
 * 📈 NEW: GET PERFORMANCE STATS & CLIENT LIST
 * Calculates total AUM, SIP Book, and the 90% (Split) Commission Payout
 */
export const getSubDistributorPerformance = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Calculate Summary Stats
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
                    -- The 90% Split Logic: (Amount * Scheme Commission % * Split %) / 12
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
        
        // 2. Fetch specific clients tied to this distributor
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