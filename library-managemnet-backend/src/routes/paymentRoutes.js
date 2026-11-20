import express from 'express';
import { createLateFeePayment, confirmLateFeePayment, getPayments } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getPayments);
router.post('/late-fee', protect, createLateFeePayment);
router.post('/:id/confirm', protect, confirmLateFeePayment);

export default router;
