import api from "./api";

/**
 * Fetch Business Dashboard summary
 */
export const getDashboardSummary = async () => {
  const response = await api.get("/dashboard");
  return response.data;
};