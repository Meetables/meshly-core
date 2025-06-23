const User = require('../models/user.models');



async function getUser(req, res) {
    const uniqueKeys = ['username', 'email', 'uid'];

    const hasKey = uniqueKeys.some(key => req.query.hasOwnProperty(key));
    if (!hasKey) {
        return res.status(400).json({ success: false, message: `Query must contain at least one of these attributes: ${uniqueKeys.join(', ')}` });
    }

    const extraKeys = Object.keys(req.query).filter(key => !uniqueKeys.includes(key));
    if (extraKeys.length > 0) {
        return res.status(400).json({ success: false, message: `Invalid query keys: ${extraKeys.join(', ')}` });
    }

    const users = await User.find(req.query);

    if (!users || users.length === 0) {
        return res.status(404).json({ success: "false", message: "User not found" });
    }

    if (users.length > 1) {
        return res.status(500).json({ success: "false", message: "Multiple users found (unknown reason). (use _id/username/email/uid)" });
    }
    const user = users[0];

    res.status(200).json({
        success: "true",
        user
    });
}

async function getUsers(req, res) {
    try {
        const users = await User.find(req.query);
        if (!users || users.length === 0) {
            return res.status(404).json({ success: false, message: "No users found" });
        }
        res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}


module.exports = { getUser, getUsers };