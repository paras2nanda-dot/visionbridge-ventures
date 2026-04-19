import express from 'express';
import { 
    getSubDistributors, 
    createSubDistributor, 
    updateSubDistributor, 
    deleteSubDistributor,
    getSubDistributorPerformance,
    getInvoicePreview,    
    createInvoice,       
    updateInvoiceStatus, 
    getInvoices,
    updateInvoice,       // 🧾 NEW: Added for Edit functionality
    deleteInvoice        // 🧾 NEW: Added for Delete functionality
} from '../controllers/subDistributor.controller.js';

const router = express.Router();

// 🧾 Invoice Management Routes
// (Note: These are placed before /:id to avoid route conflicts)
router.get('/invoices', getInvoices);
router.post('/invoices', createInvoice);
router.put('/invoices/:id', updateInvoice);          // 🟢 NEW
router.delete('/invoices/:id', deleteInvoice);       // 🟢 NEW
router.patch('/invoices/:id/status', updateInvoiceStatus);

// 🟢 Invoice Preview Route 
router.get('/:id/invoice-preview', getInvoicePreview);

// 🟢 Performance & Analytics Route
router.get('/:id/performance', getSubDistributorPerformance);

// 📋 Standard CRUD Routes
router.get('/', getSubDistributors);
router.post('/', createSubDistributor);
router.put('/:id', updateSubDistributor);
router.delete('/:id', deleteSubDistributor);

export default router;