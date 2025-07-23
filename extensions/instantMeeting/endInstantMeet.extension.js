//this function will be used for ending an instant meeting for both users, clearing their status

const FriendRequest = require("../../models/friendRequest.models");
const User = require("../../models/user.models");

async function endInstantMeeting(req, res) {
    try {
        // Check if the user is in an active instant meeting
        const userStatus = req.user.status || "";
        console.log("User status: ", userStatus);
        if (!userStatus.includes("active-instant-meet")) {
            return res.status(400).json({
                success: false,
                error: "User is not in an active instant meeting"
            });
        }

        //get the id of the instant meeting - from regex uuidv4 - , then mark is as pending false
        const instantMeetId = req.user.status.match(/id: ([\w-]+)/)[1].replaceAll(" ", "");
        console.log("Instant meeting ID: ", instantMeetId);
        //get a friend request by its id
        const request = await FriendRequest.findById(instantMeetId);

        if (!request) {
            return res.status(404).json({
                success: false,
                error: "Instant meeting request not found"
            });
        }

        request.pending = false; //mark as not pending

        await request.save();

        const senderUser = await User.findById(request.sender);
        const receiverUser = await User.findById(request.receiver);

        senderUser.status = "available";
        receiverUser.status = "available";

        await senderUser.save();
        await receiverUser.save();

        return res.status(200).json({
            success: true,
            message: "Instant meeting ended successfully"
        });
    } catch (error) {
        console.error("Error in getNearbyInstantMeetings:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
}

module.exports = { endInstantMeeting };