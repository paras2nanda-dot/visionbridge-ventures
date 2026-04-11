import { pool } from '../config/db.js';

export const getActivities = async (req, res) => {
  try {
    // We fetch the latest 20 activities. 
    // We let the frontend handle the "Time Ago" logic for better accuracy.
    const query = `
      SELECT id, user_name, action_type, entity_name, details, created_at 
      FROM activities 
      ORDER BY created_at DESC 
      LIMIT 20`;
      
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Activity Fetch Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// This helper is used if you want to log something from a controller directly
export const logActivity = async (user, type, entity, details) => {
  try {
    await pool.query(
      "INSERT INTO activities (user_name, action_type, entity_name, details) VALUES ($1, $2, $3, $4)",
      [user, type, entity, details]
    );
  } catch (err) {
    console.error("❌ Logger Error:", err.message);
  }
};