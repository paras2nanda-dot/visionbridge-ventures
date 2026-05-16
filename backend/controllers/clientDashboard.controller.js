/* eslint-disable no-unused-vars */
import { buildClientDashboard } from "../services/clientDashboard.service.js";

/**
 * 👤 INDIVIDUAL CLIENT ANALYTICS CONTROLLER
 * Standardized for consistent success/error feedback across the portal.
 */
export async function getClientDashboard(req, res) {
  try {
    // 💡 Matches 'id' from the route definition /api/client-dashboard/:id
    const { id } = req.params; 
    
    if (!id) {
        return res.status(400).json({ success: false, error: "Client ID is required." });
    }

    const data = await buildClientDashboard(id);

    // Return standardized success response
    res.json({
        success: true,
        ...data
    });
  } catch (error) {
    console.error("❌ Client Dashboard Controller Error:", error.message);
    res.status(500).json({ 
        success: false, 
        error: "Failed to load comprehensive client profile and family analytics." 
    });
  }
}