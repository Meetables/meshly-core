const User = require("../../models/user.models");

// todo: test
async function openLookups(req, res) {
    // count how many users have queried meetingLookup in the last hour
    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const userCount = await User.countDocuments({
            usedEndpoints: { $exists: true, $ne: {} },
            "usedEndpoints.meetingLookup": { $gte: oneHourAgo }
        });

        return res.status(200).json({
            success: true,
            message: "Open lookups count retrieved successfully",
            openLookupsCount: userCount
        });
    } catch (error) {
        console.error("Error in openLookups controller:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

module.exports = {openLookups};