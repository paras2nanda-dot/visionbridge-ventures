import { pool } from '../config/db.js';

/**
 * 📊 GET REVIEW STATS
 * Returns counts for "Overdue" and "Due in 7 Days" dashboard cards.
 * Rule: Only includes Family reviews if active members >= 2.
 */
export const getReviewStats = async (req, res) => {
    try {
        const query = `
            SELECT 
                COUNT(*) FILTER (WHERE next_review_date < (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date) as overdue,
                COUNT(*) FILTER (WHERE next_review_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date 
                                 AND next_review_date <= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date + INTERVAL '7 days') as due_7d
            FROM review_schedules rs
            WHERE rs.status = 'PENDING'
            AND (
                rs.entity_type = 'CLIENT' 
                OR (
                    rs.entity_type = 'FAMILY' 
                    AND (SELECT COUNT(*) FROM clients WHERE family_id = rs.family_id AND is_active = true) >= 2
                )
            )
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
 * Returns all reviews sorted by next_review_date (ascending).
 * Includes metadata: Client Code, Sub-distributor, and Family Name.
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
 * 🔒 EXECUTE REVIEW
 * 1. Appends a new log entry to review_logs (Audit History).
 * 2. Updates the review_schedules with the new 'next_review_date'.
 * Uses a transaction to ensure both or neither succeed.
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

        // 1. Mandatory Validation
        if (!remarks || remarks.trim() === "") {
            throw new Error("Remarks/Notes field is mandatory");
        }

        // 2. Insert into History Logs (Append-Only)
        const logQuery = `
            INSERT INTO review_logs (
                entity_type, 
                entity_id, 
                outcome, 
                remarks, 
                reviewed_by, 
                next_review_scheduled
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

        // 3. Update the Schedule for the next cycle
        const updateQuery = `
            UPDATE review_schedules 
            SET next_review_date = $1, 
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `;
        await dbClient.query(updateQuery, [next_review_date, schedule_id]);

        await dbClient.query('COMMIT');
        res.json({ success: true, message: "Review recorded and next cycle scheduled." });

    } catch (err) {
        await dbClient.query('ROLLBACK');
        console.error("❌ executeReview Error:", err.message);
        res.status(400).json({ error: err.message });
    } finally {
        dbClient.release();
    }
};