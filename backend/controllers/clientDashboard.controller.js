import { buildClientDashboard } from "../services/clientDashboard.service.js";

export async function getClientDashboard(req, res) {
  try {
    const { clientId } = req.params;
    const data = await buildClientDashboard(clientId);

    // 🛡️ Return the object directly to match frontend .then(data => ...) logic
    res.json(data);
  } catch (error) {
    console.error("Client Dashboard Controller Error:", error);
    res.status(500).json({ error: "Failed to load client dashboard" });
  }
}