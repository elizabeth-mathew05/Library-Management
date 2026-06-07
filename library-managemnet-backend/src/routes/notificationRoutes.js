import express from 'express';
import { getNotifications, createAnnouncement, markNotificationRead, deleteNotification } from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.post('/announcements', protect, authorize('librarian', 'admin'), createAnnouncement);
router.patch('/:id/read', protect, markNotificationRead);
router.delete('/:id', protect, deleteNotification);

export default router;
