const FriendRequest = require("../../models/friendRequest.models");

//this function gets instant meet requests send to the user's profile
async function getNearbyInstantMeetings(req, res) {
    try {
        //find pending friend requests send to the user or even by the user
        
        const raw_requests_received = await FriendRequest.find({
            receiver: req.user._id,
            pending: true,
            comment: { $regex: /instant meet/i } //case-insensitive search for "instant meet" in the comment
        })
        .populate('sender', 'displayName profilePicture lastLocation profileTags username')
        
        const requests_received = raw_requests_received.map(request => {
                return {
                    requestId: request._id,
                    sender: {
                        id: request.sender._id,
                        displayName: request.sender.displayName,
                        profilePicture: request.sender.profilePicture,
                        lastLocation: request.sender.lastLocation,
                        profileTags: request.sender.profileTags,
                        username: request.sender.username
                    },
                    comment: request.comment,
                    timestamp: request.createdAt
                };
            });

        const raw_requests_sent = await FriendRequest.find({
            sender: req.user._id,
            pending: true,
            comment: { $regex: /instant meet/i } //case-insensitive search for "instant meet" in the comment
        })
        .populate('receiver', 'displayName profilePicture lastLocation profileTags username')
        
        const requests_sent = raw_requests_sent.map(request => {
                return {
                    requestId: request._id,
                    receiver: {
                        id: request.receiver._id,
                        displayName: request.receiver.displayName,
                        profilePicture: request.receiver.profilePicture,
                        lastLocation: request.receiver.lastLocation,
                        profileTags: request.receiver.profileTags,
                        username: request.receiver.username
                    },
                    comment: request.comment,
                    timestamp: request.createdAt
                };
            });

        if (!requests_received.length && !requests_sent.length) {
            return res.status(404).json({
                success: false,
                error: "No instant meeting requests found"
            });
        }

        res.status(200).json({
            success: true,
            receivedRequests: requests_received || undefined,
            sentRequests: requests_sent || undefined
        });

    } catch (error) {
        console.error("Error in getNearbyInstantMeetings:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
}

module.exports = { getNearbyInstantMeetings };