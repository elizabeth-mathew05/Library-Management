import Notification from '../models/Notification.js';
import asyncHandler from '../middleware/asyncHandler.js';

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ $or: [{ user: req.user._id }, { user: null }] })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json(notifications);
});

const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, message } = req.body;
  const notification = await Notification.create({
    title,
    message,
    type: 'announcement',
    user: null
  });

  res.status(201).json(notification);
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  notification.read = true;
  await notification.save();

  res.json(notification);
});

export { getNotifications, createAnnouncement, markNotificationRead };
