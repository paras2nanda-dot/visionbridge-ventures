import { buildClientDashboard } from "../services/clientDashboard.service.js";

export async function getClientDashboard(req, res) {
  try {
    const { clientId } = req.params;

    // The service buildClientDashboard should fetch 'monthly_income' 
    // from the clients table and include it in the 'profile' object.
    const data = await buildClientDashboard(clientId);

    // Sending data directly as the frontend .then(data => ...) expects the object
    res.json(data);
  } catch (error) {
    console.error("Client Dashboard Controller Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load client dashboard"
    });
  }
}