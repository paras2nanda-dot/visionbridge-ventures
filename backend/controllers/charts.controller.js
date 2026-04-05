import { getChartsData } from "../services/charts.service.js";

export const getCharts = async (req, res) => {
  try {
    const data = await getChartsData();

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error("Charts Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load charts data"
    });
  }
};