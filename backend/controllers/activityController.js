import { pool } from '../config/db.js';

/**
 * Fetches the latest system activities.
 * The ORDER BY created_at DESC ensures that the "Refresh" button
 * always pulls the absolute latest entries first.
 */
export const getActivities = async (req, res) => {
  try {
    const query = `
      SELECT 
        id, 
        user_name, 
        action_type, 
        entity_name, 
        details, 
        old_data, 
        new_data, 
        created_at 
      FROM activities 
      ORDER BY created_at DESC 
      LIMIT 50`; 
      
    const result = await pool.query(query);
    
    // Set headers to prevent browser caching, ensuring the "Refresh" button works every time
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fetch Error:", err.message);
    res.status(500).json({ error: "Could not fetch activities" });
  }
};

/**
 * Enhanced Logger: Now captures 'before' and 'after' snapshots.
 * @param {string} user - The name of the user performing the action.
 * @param {string} type - CREATE, UPDATE, or DELETE.
 * @param {string} entity - The category (e.g., 'Client', 'SIP', 'Scheme').
 * @param {string} details - A human-readable description.
 * @param {object} oldData - (Optional) The record state BEFORE the change.
 * @param {object} newData - (Optional) The record state AFTER the change.
 */
export const logActivity = async (user, type, entity, details, oldData = null, newData = null) => {
  try {
    const query = `
      INSERT INTO activities (user_name, action_type, entity_name, details, old_data, new_data) 
      VALUES ($1, $2, $3, $4, $5, $6)`;
      
    // Using JSON.stringify ensures the data is stored as a valid JSON string/object in Postgres
    await pool.query(query, [
      user || 'System', 
      type, 
      entity || 'General', 
      details, 
      oldData ? JSON.stringify(oldData) : null, 
      newData ? JSON.stringify(newData) : null
    ]);
    
    console.log(`✅ Forensic Log: ${type} recorded for ${entity}`);
  } catch (err) {
    console.error("❌ Logger Error:", err.message);
  }
};

/**
 * 🗑️ Bulk Deletes selected activity logs from the database.
 * Used by the Command Center to clear out old or unwanted audit trails.
 */
export const bulkDeleteActivities = async (req, res) => {
  const { ids } = req.body;
  
  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No activity IDs provided for deletion." });
    }

    // Type-cast to string for PostgreSQL ANY() array compatibility
    const cleanIds = ids.map(id => String(id));
    
    await pool.query('DELETE FROM activities WHERE id::text = ANY($1::text[])', [cleanIds]);
    
    console.log(`🚨 Forensic Log Purge: Permanently deleted ${ids.length} activity records.`);

    res.json({ message: "Successfully deleted selected activities." });
  } catch (err) {
    console.error("❌ Bulk Delete Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};