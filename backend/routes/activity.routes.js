import express from 'express';
import { getActivities, bulkDeleteActivities } from '../controllers/activityController.js';

const router = express.Router();

// Publicly links the frontend request to the fetching logic
router.get('/', getActivities);

// Route for the Command Center to bulk delete selected forensic logs
router.post('/bulk-delete', bulkDeleteActivities);

export default router;