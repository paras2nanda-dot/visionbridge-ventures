import { pool } from '../config/db.js';

export const getActivities = async (req, res) => {
  try {
    const query = `
      SELECT id, user_name, action_type, entity_name, details, created_at 
      FROM activities 
      ORDER BY created_at DESC 
      LIMIT 30`; // Increased limit for better visibility
      
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fetch Error:", err.message);
    res.status(500).json({ error: "Could not fetch activities" });
  }
};

export const logActivity = async (user, type, entity, details) => {
  try {
    const query = `
      INSERT INTO activities (user_name, action_type, entity_name, details) 
      VALUES ($1, $2, $3, $4)`;
      
    await pool.query(query, [user || 'System', type, entity || 'General', details]);
    console.log(`✅ Logged: ${type} for ${entity}`);
  } catch (err) {
    console.error("❌ Logger Error:", err.message);
  }
};