const { newNotification } = require("../controllers/profile/notifications");
const FriendRequest = require("../models/friendRequest.models");
const User = require("../models/user.models");
const { meetingPointByCoordinates } = require("./calculateMeetingLocation.extension");

async function acceptInstantMeetRequest(req, res) {
    const { requestId, location } = req.body;

    if (!requestId || !location) {
        return res.status(400).json({
            success: false,
            error: "Missing required fields"
        });
    }

    req.user.lastLocation = location;

    await req.user.save();

    //calculate meeting location: lookup meeting request sender location
    const request = await FriendRequest.findById(requestId);

    if (!request) {
        return res.status(404).json({
            success: false,
            error: "Meeting request not found"
        });
    }

    const instantMeetId = request.comment.replace("Instant Meet request with id ", "");

    //look up whether there's an existing instant meet request, condition: request's comment includes case-insensitive "instant meet"
    const instantMeetingRequestWithSameId = await FriendRequest.find({
        comment: new RegExp(instantMeetId, "i"),
        sender: request.sender,
        pending: false,
        accepted: true
    })

    if (instantMeetingRequestWithSameId.length) {
        return res.status(406).json({
            success: false,
            error: "Instant Meeting already taken"
        })
    }

    //mark request as accepted
    request.pending = false;
    request.accepted = true;
    await request.save();

    const sender = await User.findById(request.sender);

    const senderLastLocation = sender.lastLocation;

    if (!senderLastLocation) {
        return res.status(404).json({
            success: false,
            error: "Sender location not found"
        });
    }

    //call algorithm to calculate meeting location here, return Google Maps link

    const loc1 = parseLocationString(req.user.lastLocation);
    const loc2 = parseLocationString(senderLastLocation);

    if (!loc1 || !loc2) {
        return res.status(400).json({
            success: false,
            error: "Invalid location format"
        });
    }

    //call algorithm to calculate meeting location here, return Google Maps link
    console.log("calculating meeting location")
    const meetingLocation = await meetingPointByCoordinates(
        [loc1, loc2],
        1000,
        "driving-car",
        "distance"
    );

    if (!meetingLocation) {
        res.status(400).json({
            success: false,
            error: ""
        })
    }

    //notify user who sent the request originally
    newNotification(
        {
            type: "instant_meet_result_accepted",
            timestamp: Date.now(),
            content: JSON.stringify({
                meetingLocation: meetingLocation,
                text: req.user.username + " accepted your instant meet request"
            }
            ),
            pending: true
        }, request.sender
    );


    res.status(200).json({
        success: true,
        message: "Instant meet request accepted",
        requestId,
        meetingLocation: meetingLocation
    });
}

function parseLocationString(str) {
    if (Array.isArray(str)) return str;
    if (typeof str !== "string") return null;
    const parts = str.split(",").map(s => Number(s.trim()));
    if (parts.length !== 2 || parts.some(isNaN)) return null;
    return [parts[1], parts[0]];
}

module.exports = { acceptInstantMeetRequest };
