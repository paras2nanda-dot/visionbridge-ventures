import express from "express";
import { getCharts } from "../controllers/charts.controller.js";

const router = express.Router();

/*
  GET /api/charts
  Returns:
  - Count-based charts
  - AUM-based charts
*/
router.get("/", getCharts);

export default router;