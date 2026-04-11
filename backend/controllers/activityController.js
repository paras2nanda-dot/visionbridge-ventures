import { pool } from '../config/db.js';

// 🕒 Fetches the most recent 20 activities
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
    res.status(500).json({ error: "Could not fetch activities" });
  }
};

// 🛡️ Helper to save logs (Matches the 4-argument logic in routes)
export const logActivity = async (user, type, entity, details) => {
  try {
    const query = `
      INSERT INTO activities (user_name, action_type, entity_name, details) 
      VALUES ($1, $2, $3, $4)`;
      
    await pool.query(query, [user || 'System', type, entity || 'General', details]);
    console.log(`✅ Logged: ${type} by ${user}`);
  } catch (err) {
    console.error("❌ Logger Error:", err.message);
  }
};