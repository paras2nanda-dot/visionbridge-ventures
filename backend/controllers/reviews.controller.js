import { pool } from '../config/db.js';

/**
 * 📊 GET REVIEW STATS
 * Returns counts for "Overdue", "Due in 7 Days", and "Completed in 7 Days".
 * Rule: Only includes Family reviews if active members >= 2.
 */
export const getReviewStats = async (req, res) => {
    try {
        const query = `
            WITH stats AS (
                SELECT 
                    COUNT(*) FILTER (WHERE next_review_date < (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date) as overdue,
                    COUNT(*) FILTER (WHERE next_review_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date 
                                     AND next_review_date <= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date + INTERVAL '7 days') as due_7d
                FROM review_schedules rs
                LEFT JOIN clients c ON rs.client_id = c.id
                WHERE rs.status = 'PENDING'
                AND (rs.client_id IS NULL OR c.is_active = true)
                AND (
                    rs.entity_type = 'CLIENT' 
                    OR (
                        rs.entity_type = 'FAMILY' 
                        AND (SELECT COUNT(*) FROM clients WHERE family_id = rs.family_id AND is_active = true) >= 2
                    )
                )
            ),
            completed AS (
                SELECT COUNT(*) as completed_7d 
                FROM review_logs 
                WHERE review_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date - INTERVAL '7 days'
            )
            SELECT stats.*, completed.completed_7d FROM stats, completed
        `;
        const result = await pool.query(query);
        res.json(result.rows[0]);
    } catch (err) {
        console.error("❌ getReviewStats Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

/**
 * 📋 GET PENDING REVIEWS
 * Returns list of upcoming reviews sorted by urgency.
 */
export const getPendingReviews = async (req, res) => {
    try {
        const query = `
            SELECT 
                rs.*,
                CASE 
                    WHEN rs.entity_type = 'CLIENT' THEN c.full_name 
                    ELSE f.family_name 
                END as entity_name,
                c.client_code,
                sd.name as sub_distributor_name
            FROM review_schedules rs
            LEFT JOIN clients c ON rs.client_id = c.id
            LEFT JOIN families f ON rs.family_id = f.id
            LEFT JOIN sub_distributors sd ON c.sub_distributor_id = sd.id
            WHERE rs.status = 'PENDING'
            AND (rs.client_id IS NULL OR c.is_active = true)
            AND (
                rs.entity_type = 'CLIENT' 
                OR (
                    rs.entity_type = 'FAMILY' 
                    AND (SELECT COUNT(*) FROM clients WHERE family_id = rs.family_id AND is_active = true) >= 2
                )
            )
            ORDER BY rs.next_review_date ASC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("❌ getPendingReviews Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

/**
 * 🔍 SEARCH ENTITIES FOR REVIEW
 * Fetches both Clients and eligible Families for manual/ad-hoc reviews.
 */
export const searchEntitiesForReview = async (req, res) => {
    const { term } = req.query;
    try {
        const clientQuery = `
            SELECT 'CLIENT' as type, id, full_name as name, client_code 
            FROM clients 
            WHERE is_active = true AND (full_name ILIKE $1 OR client_code ILIKE $1)
            LIMIT 5
        `;
        const familyQuery = `
            SELECT 'FAMILY' as type, f.id, f.family_name as name, NULL as client_code
            FROM families f
            WHERE f.family_name ILIKE $1
            AND (SELECT COUNT(*) FROM clients WHERE family_id = f.id AND is_active = true) >= 2
            LIMIT 5
        `;
        
        const clients = await pool.query(clientQuery, [`%${term}%`]);
        const families = await pool.query(familyQuery, [`%${term}%`]);
        
        res.json([...clients.rows, ...families.rows]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * 📜 GET REVIEW HISTORY
 * Fetches all past review logs for a specific client or family.
 */
export const getReviewHistory = async (req, res) => {
    const { entity_type, entity_id } = req.params;
    try {
        const query = `
            SELECT * FROM review_logs 
            WHERE entity_type = $1 AND entity_id = $2 
            ORDER BY review_date DESC
        `;
        const result = await pool.query(query, [entity_type, entity_id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * 🔒 EXECUTE REVIEW
 * Records the outcome and updates the next scheduled date.
 */
export const executeReview = async (req, res) => {
    const { 
        schedule_id, 
        entity_type, 
        entity_id, 
        outcome, 
        remarks, 
        next_review_date, 
        reviewed_by 
    } = req.body;

    const dbClient = await pool.connect();

    try {
        await dbClient.query('BEGIN');

        if (!remarks || remarks.trim() === "") {
            throw new Error("Remarks/Notes field is mandatory");
        }

        // 1. Insert into History Logs (Audit History)
        const logQuery = `
            INSERT INTO review_logs (
                entity_type, entity_id, outcome, remarks, reviewed_by, next_review_scheduled
            ) VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await dbClient.query(logQuery, [
            entity_type, 
            entity_id, 
            outcome, 
            remarks, 
            reviewed_by || 'System', 
            next_review_date
        ]);

        // 2. Update existing schedule OR Create one for Ad-hoc reviews
        if (schedule_id) {
            await dbClient.query(
                `UPDATE review_schedules SET next_review_date = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
                [next_review_date, schedule_id]
            );
        } else {
            const idCol = entity_type === 'CLIENT' ? 'client_id' : 'family_id';
            await dbClient.query(
                `INSERT INTO review_schedules (entity_type, ${idCol}, next_review_date) 
                 VALUES ($1, $2, $3)
                 ON CONFLICT (${idCol}) DO UPDATE SET next_review_date = $3, updated_at = CURRENT_TIMESTAMP`,
                [entity_type, entity_id, next_review_date]
            );
        }

        await dbClient.query('COMMIT');
        res.json({ success: true, message: "Review recorded successfully." });

    } catch (err) {
        await dbClient.query('ROLLBACK');
        console.error("❌ executeReview Error:", err.message);
        res.status(400).json({ error: err.message });
    } finally {
        dbClient.release();
    }
};