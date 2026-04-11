import { pool } from '../config/db.js';

// This fetches the logs for the frontend
export const getActivities = async (req, res) => {
  try {
    const query = `
      SELECT id, user_name, action_type, entity_name, details, created_at 
      FROM activities 
      ORDER BY created_at DESC 
      LIMIT 20`;
      
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fetch Error:", err.message);
    res.status(500).json({ error: "Could not fetch activities from database" });
  }
};

// This is the helper used by other controllers to save logs
export const logActivity = async (user, type, entity, details) => {
  try {
    // 🛡️ Ensure we are using the new column names: user_name, action_type, entity_name, details
    const query = `
      INSERT INTO activities (user_name, action_type, entity_name, details) 
      VALUES ($1, $2, $3, $4)`;
      
    await pool.query(query, [user, type, entity, details]);
    console.log(`✅ Logged: ${type} by ${user}`);
  } catch (err) {
    // If this fails, it's usually because the database columns don't exist yet
    console.error("❌ Logger Error (Check Database Columns):", err.message);
  }
};