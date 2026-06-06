import express from 'express';
import { getReservations, createReservation, cancelReservation } from '../controllers/reservationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getReservations);
router.post('/', protect, createReservation);
router.patch('/:id/cancel', protect, cancelReservation);

export default router;
