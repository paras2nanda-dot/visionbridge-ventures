import { buildClientDashboard } from "../services/clientDashboard.service.js";

export async function getClientDashboard(req, res) {
  try {
    const { clientId } = req.params;

    const data = await buildClientDashboard(clientId);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error("Client Dashboard Controller Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load client dashboard"
    });
  }
}