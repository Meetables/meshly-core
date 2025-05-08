const User = require("../models/user.models");
// DONE
async function sendMeetingRequest(userId, targetUserId, isInstantMeet) {
    try {
        //get target user
        const targetUser = await User.findById(targetUserId);
        const user = await User.findById(userId);

        //push to target user's received friend requests
        if (isInstantMeet) {
            targetUserId.receivedFriendRequests.push({ sender: userId, pending: true, comment: "Instant Meet request" });
            await targetUser.save();

            user.sentFriendRequests.push({ receiver: targetUserId, pending: true, comment: "Instant Meet request" });
            await user.save();
    
        } else {
            targetUserId.receivedFriendRequests.push({ sender: userId, pending: true, comment: "Meet request" });
            await targetUser.save();

            user.sentFriendRequests.push({ receiver: targetUserId, pending: true, comment: "Meet request" });
            await user.save();
    
        }
       
        return res.status(200).json({
            success: true
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error
        })
    }
}

module.exports = {
    sendMeetingRequest
}