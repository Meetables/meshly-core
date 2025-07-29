const FriendRequest = require("../../models/friendRequest.models");
const User = require("../../models/user.models");

// This function gets instant meet requests send to the user's profile
async function getNearbyInstantMeetings(req, res) {
    try {
        // Find pending friend requests send to the user or even by the user
        let activeRequest;
        if (req.user.status && req.user.status.includes("active-instant-meet")) {
            console.log("User status found:", req.user.status);

            // Fixed regex to properly capture MongoDB ObjectId (24 hex characters)
            const activeRequestId = req.user.status.match(/id:\s*([a-f0-9]{24})/i);
            console.log("Active request ID found in user status:", activeRequestId);

            if (activeRequestId && activeRequestId[1]) {
                try {
                    activeRequest = await FriendRequest.findById(activeRequestId[1]);
                    if (activeRequest) {
                        activeRequest = activeRequest.toObject();
                        activeRequest._id = undefined;
                        activeRequest.requestId = activeRequestId[1];

                        console.log("Active request found in database:", activeRequest);
                        const otherUserId = [activeRequest.sender, activeRequest.receiver]
                            .filter(id => id.toString() !== req.user._id.toString())[0];

                        if (otherUserId) {
                            const otherUser = await User.findById(otherUserId);
                            activeRequest.otherUsername = otherUser ? otherUser.username : null;
                            console.log("Other user found:", activeRequest.otherUsername);
                        }

                        let location = activeRequest.comment.match(/location: (.+)/i);
                        location = toLocationObj(location ? location[1].split(',').map(Number) : null);
                        activeRequest.location = location;
                        console.log("Active request found:", activeRequest);
                    }
                } catch (dbError) {
                    console.error("Error fetching active request:", dbError);
                    // Continue execution even if active request fetch fails
                }
            }
        }

        let requests_received = await FriendRequest.find({
            receiver: req.user._id,
            pending: true,
            comment: { $regex: /instant meet/i } // case-insensitive search for "instant meet" in the comment
        });

        let requests_sent = await FriendRequest.find({
            sender: req.user._id,
            pending: true,
            comment: { $regex: /instant meet/i } // case-insensitive search for "instant meet" in the comment
        });

        if (!requests_received.length && !requests_sent.length) {
            return res.status(404).json({
                success: false,
                error: "No instant meeting requests found"
            });
        }

        //Replace requests_sent.request and requests_received.requestId with .requestId
        requests_received = await Promise.all(requests_received.map(async request => {
            const requestObj = request.toObject();
            requestObj.requestId = requestObj._id.toString();
            requestObj._id = undefined; // Remove _id field

            const otherUserId = [request.sender, request.receiver]
                .filter(id => id.toString() !== req.user._id.toString())[0];

            if (otherUserId) {
                const otherUser = await User.findById(otherUserId);
                requestObj.otherUsername = otherUser ? otherUser.username : null;
                console.log("Other user found:", request.otherUsername);
            }
            return requestObj;
        }));

        requests_sent = await Promise.all(requests_sent.map(async request => {
            const requestObj = request.toObject();
            requestObj.requestId = requestObj._id.toString();
            requestObj._id = undefined; // Remove _id field

            const otherUserId = [request.sender, request.receiver]
                .filter(id => id.toString() !== req.user._id.toString())[0];

            if (otherUserId) {
                const otherUser = await User.findById(otherUserId);
                requestObj.otherUsername = otherUser ? otherUser.username : null;
                console.log("Other user found:", requestObj.otherUsername);
            }
            
            return requestObj;
        }));

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

function toLocationObj(arr) {
    if (
        !Array.isArray(arr) ||
        arr.length !== 2 ||
        typeof arr[0] !== 'number' ||
        typeof arr[1] !== 'number' ||
        isNaN(arr[0]) ||
        isNaN(arr[1])
    ) {
        return null;
    }
    return { lng: arr[1], lat: arr[0] };
}

module.exports = { getNearbyInstantMeetings };