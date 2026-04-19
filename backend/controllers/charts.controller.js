import { getChartsData } from "../services/charts.service.js";

/**
 * 📊 EXECUTIVE ANALYTICS CONTROLLER
 * Fetches processed data for all dashboard charts
 */
export const getCharts = async (req, res) => {
  try {
    // The heavy lifting (math/SQL) happens inside this service call
    const data = await getChartsData();

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error("❌ Charts Controller Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load charts data. Check backend logs for SQL errors."
    });
  }
};