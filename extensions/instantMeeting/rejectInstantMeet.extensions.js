const FriendRequest = require("../../models/friendRequest.models");

async function rejectInstantMeetRequest(req, res) {
    const {requestId } = req.body;

    if (!requestId) {
        return res.status(400).json({
            success: false,
            error: "Missing required fields"
        });
    }

    const request = await FriendRequest.findById(requestId);

    if (!request) {
        return res.status(404).json({
            success: false,
            error: "Meeting request not found"
        });
    }

    const uuidV4Regex = /\b[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
    const instantMeetId = request.comment.match(uuidV4Regex);

    if (!instantMeetId || !instantMeetId.length) {
        return res.status(400).json({
            success: false,
            error: "Invalid instant meet request format"
        });
    }

    //look up whether there's an existing instant meet request, condition: request's comment includes case-insensitive "instant meet"
    const identicalInstantMeetingRequest = await FriendRequest.find({
        comment: new RegExp(instantMeetId, "i"),
        sender: request.sender,
        pending: false,
        accepted: false
    })

    if (identicalInstantMeetingRequest.length) {
        return res.sendStatus(204);
    }

    //mark request as accepted
    request.accepted = false;
    await request.save();


   return res.sendStatus(204);
}

module.exports = { rejectInstantMeetRequest };
