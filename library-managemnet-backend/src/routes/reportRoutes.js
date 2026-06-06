import express from 'express';
import { getDashboardReport } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, authorize('librarian', 'admin'), getDashboardReport);

export default router;
