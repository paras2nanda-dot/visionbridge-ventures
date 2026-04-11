import { buildClientDashboard } from "../services/clientDashboard.service.js";

export async function getClientDashboard(req, res) {
  try {
    // 💡 THE FIX: Match 'id' from the route definition /:id
    const { id } = req.params; 
    const data = await buildClientDashboard(id);

    res.json(data);
  } catch (error) {
    console.error("Client Dashboard Controller Error:", error);
    res.status(500).json({ error: "Failed to load client dashboard" });
  }
}