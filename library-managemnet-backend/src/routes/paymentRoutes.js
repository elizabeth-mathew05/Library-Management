import express from 'express';
import { createLateFeePayment, getPayments } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getPayments);
router.post('/late-fee', protect, createLateFeePayment);

export default router;
