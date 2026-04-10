import express from 'express';
import { getActivities } from '../controllers/activityController.js';

const router = express.Router();

// This links the frontend request to the database logic
router.get('/', getActivities);

export default router;