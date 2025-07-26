const FriendRequest = require("../../models/friendRequest.models");

//this function gets instant meet requests send to the user's profile
async function getNearbyInstantMeetings(req, res) {
    try {
        //find pending friend requests send to the user or even by the user
        const activeRequestId = req.user.status.match(/id: ([\w-]+)/);

        let activeRequest;

        if (activeRequestId && activeRequestId.length) {
            activeRequest = await FriendRequest.findById(activeRequestId[1]);
            activeRequest.location = activeRequest.comment.match(/location: (.+)/i);
            console.log("Active request found:", activeRequest);
        }
        
        const requests_received = await FriendRequest.find({
            receiver: req.user._id,
            pending: true,
            comment: { $regex: /instant meet/i } //case-insensitive search for "instant meet" in the comment
        })

        const requests_sent = await FriendRequest.find({
            sender: req.user._id,
            pending: true,
            comment: { $regex: /instant meet/i } //case-insensitive search for "instant meet" in the comment
        })    

        if (!requests_received.length && !requests_sent.length) {
            return res.status(404).json({
                success: false,
                error: "No instant meeting requests found"
            });
        }

        res.status(200).json({
            success: true,
            receivedRequests: requests_received || undefined,
            sentRequests: requests_sent || undefined,
            activeRequest: activeRequest || undefined
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