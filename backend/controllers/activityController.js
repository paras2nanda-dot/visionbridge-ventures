import { pool } from '../config/db.js';

// FETCH ALL ACTIVITIES
export const getActivities = async (req, res) => {
  try {
    const query = `
      SELECT *, 
      CASE 
        WHEN created_at >= NOW() - INTERVAL '1 minute' THEN 'Just now'
        WHEN created_at >= NOW() - INTERVAL '1 hour' THEN EXTRACT(MINUTE FROM NOW() - created_at)::TEXT || ' minutes ago'
        WHEN created_at >= NOW() - INTERVAL '1 day' THEN EXTRACT(HOUR FROM NOW() - created_at)::TEXT || ' hours ago'
        ELSE TO_CHAR(created_at, 'DD Mon YYYY')
      END as time_label
      FROM activities ORDER BY created_at DESC LIMIT 15`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// REUSABLE LOGGER (This records the actions)
export const logActivity = async (type, title, description) => {
  const configs = {
    client: { icon: '👤', color: '#0ea5e9' },
    sip: { icon: '🔄', color: '#10b981' },
    txn: { icon: '💸', color: '#f59e0b' },
    scheme: { icon: '📊', color: '#8b5cf6' }
  };
  const { icon, color } = configs[type] || { icon: '📝', color: '#64748b' };
  try {
    await pool.query(
      "INSERT INTO activities (type, icon, title, description, color) VALUES ($1, $2, $3, $4, $5)",
      [type, icon, title, description, color]
    );
  } catch (err) {
    console.error("❌ Logger Error:", err.message);
  }
};