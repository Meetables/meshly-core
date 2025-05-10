const { get } = require("mongoose");

async function newNotification(notification, userId){
    const { type, content } = notification;

    if (!type || !content) {
        return res.status(400).json({
            success: false,
            error: "Type and content are required"
        })
    }

    const newNotification = {
        type,
        timestamp: Date.now(),
        content,
        pending: true
    }
    //push notification to user
    const user = await User.findById(userId);

    if (!user) {
        return;
    }

    user.notifications.push(newNotification);

    await user.save();

    return {
        success: true
    }
}

//TODO: Provide documentation for different types of notifications

async function getNotifications(req, res) {
try {
    const notifications = req.user.notifications;

    if (!notifications || notifications.length === 0) {
        return res.status(200).json({
            success: true,
            notifications: []
        })
    }

    const formattedNotifications = notifications.map(notification => {
        return {
            type: notification.type,
            timestamp: notification.timestamp,
            content: notification.content,
            pending: notification.pending
        }
    });

    return res.status(200).json({
        success: true,
        notifications: formattedNotifications
    })
} catch (error) {
    return res.status(500).json({
        success: false,
        error: error
    })
}
}

module.exports = {getNotifications, newNotification};