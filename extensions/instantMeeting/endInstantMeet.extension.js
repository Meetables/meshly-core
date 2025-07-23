//this function will be used for ending an instant meeting for both users, clearing their status

async function endInstantMeeting(req, res) {
    try {
        // Check if the user is in an active instant meeting
        if (!req.user.status.contains("active-instant-meet")) {
            return res.status(400).json({
                success: false,
                error: "User is not in an active instant meeting"
            });
        }

        //get the id of the instant meeting - from regex uuidv4 - , then mark is as pending false
        const instantMeetId = req.user.status.match(/id: ([\w-]+)/)[1];

        const request = await FriendRequest.findOne({
            comment: new RegExp(instantMeetId, "i"),
            sender: req.user._id,
            pending: false,
            accepted: true
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                error: "Instant meeting request not found"
            });
        }

        request.pending = false; //mark as not pending

        await request.save();

        return res.status(200).json({
            success: true,
            message: "Instant meeting ended successfully"
        });
    } catch (error) {
        
    }
}

module.exports = { endInstantMeeting };