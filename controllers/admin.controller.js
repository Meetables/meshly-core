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

async function userElevation(req, res) {
    const { uid, username, email, clearance } = req.body;
    if (!uid && !username && !email) {
        return res.status(400).json({ success: false, message: "At least one of uid, username, or email is required" });
    }
    if (!clearance) {
        return res.status(400).json({ success: false, message: "Clearance is required" });
    }

    let query = {};
    if (username !== undefined) {
        query.username = username;
    }
    if (uid !== undefined) {
        query.uid = uid;
    }
    if (email !== undefined) {
        query.email = email;
    }
    let user;
    try {
        user = await User.findOne(query);
    } catch (err) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.clearance === clearance) {
        return res.status(400).json({ success: false, message: "User already has this clearance" });
    }
    user.clearance = clearance;
    try {
        await user.save();
        return res.status(200).json({ success: true, user });
    } catch (err) {
        console.error("Error updating user clearance:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

    



module.exports = { getUser, getUsers, userElevation };