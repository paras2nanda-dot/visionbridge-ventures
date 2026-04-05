import express from 'express';
import { getSchemes, createScheme, updateScheme, deleteScheme } from '../controllers/mfSchemes.controller.js';

const router = express.Router();

// Route all requests to the Master Controller
router.get('/', getSchemes);
router.post('/', createScheme);
router.put('/:id', updateScheme); 
router.delete('/:id', deleteScheme);

export default router;