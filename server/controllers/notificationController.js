const Notification = require('../models/Notification');

const notificationController = {
  async getNotifications(req, res, next) {
    try {
      const { auth0Id } = req.params;
      const notifications = await Notification.find({ recipient: auth0Id })
        .sort({ createdAt: -1 })
        .limit(50);
      
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const { notificationId } = req.params;
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { read: true },
        { new: true }
      );
      
      if (!notification) {
        const error = new Error('Notification not found');
        error.status = 404;
        throw error;
      }
      
      res.json(notification);
    } catch (error) {
      next(error);
    }
  },

  async deleteNotification(req, res, next) {
    try {
      const { notificationId } = req.params;
      const notification = await Notification.findByIdAndDelete(notificationId);
      
      if (!notification) {
        const error = new Error('Notification not found');
        error.status = 404;
        throw error;
      }
      
      res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = notificationController;