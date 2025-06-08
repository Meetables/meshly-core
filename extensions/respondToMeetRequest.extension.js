const { newNotification } = require("../controllers/profile/notifications");
const FriendRequest = require("../models/friendRequest.models");

async function respondToMeetRequest(req, res) {
    const { requestId, result, suggestions } = req.body;
    //suggestions: JSON as string encoded object with either location, time or both

    if (!requestId || ["accepted", "rejected"].includes(result) === false) {
        return res.status(400).json({
            success: false,
            error: "Missing required fields or wrong result format provided"
        });
    }

    let _suggestions = {};
    if (suggestions) {
        _suggestions = JSON.parse(suggestions);
    }

    const request = await FriendRequest.findById(requestId);

    if (!request) {
        return res.status(404).json({
            success: false,
            error: "Meeting request not found"
        });
    }

    request.accepted = (result === "accepted");

    //if there are suggestions, add them to the request's comment
    //comment format: Meet request for location with lat ${lat} and lon ${lon} on ${datetime}

    if (_suggestions && ((_suggestions.lat && _suggestions.lon) || _suggestions.time)) {
        const requestComment = request.comment;
        //if there's a suggested location, replace the old lat and lon with the new ones - if there's a new suggested time, replace the old one with the new one
        if (_suggestions.lat && _suggestions.lon) {
            request.comment = requestComment.replace(/lat [\d.-]+ and lon [\d.-]+/, `lat ${_suggestions.lat} and lon ${_suggestions.lon}`);
        }

        if (_suggestions.time) {
            request.comment = requestComment.replace(/on [\d-: ]+/, `on ${_suggestions.time}`);
        }

        //add "(includes suggestions fron user ${req.user.username})" to the end of the comment if it doesn't already include that part or change the username respectively
        if (!request.comment.includes(`(includes suggestions from user`)) {
            request.comment += ` (includes suggestions from user ${req.user.username})`;
        } else {
            request.comment = request.comment.replace(/user [\w-]+/, `user ${req.user.username}`);
        }
    }

    if (!_suggestions.lat && !suggestions.time && result === "accepted") {
        request.pending = false;
    }

    await request.save();

    //notify the other user who's id isn't that of the one responding that the request has been responded to
    const userToNotify = request.sender.toString() === req.user._id.toString() ? request.receiver : request.sender;

    newNotification({
        type: "meet_request_response",
        timestamp: Date.now(),
        content: JSON.stringify({
            requestId: request._id,
            result: result,
            suggestions: _suggestions
        }),
        pending: true
    }, userToNotify)
        .then(() => {
            return res.sendStatus(204);
        })
        .catch(error => {
            console.error("Error in respondToMeetRequest controller:", error);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: error.message || error
            });
        });

}

module.exports = { respondToMeetRequest };