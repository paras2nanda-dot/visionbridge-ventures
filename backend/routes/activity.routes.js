import express from 'express';
import { getActivities } from '../controllers/activityController.js';

const router = express.Router();

// Publicly links the frontend request to the fetching logic
router.get('/', getActivities);

export default router;