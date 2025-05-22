const { newNotification } = require("../controllers/profile/notifications");
const FriendRequest = require("../models/friendRequest.models");
const User = require("../models/user.models");

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

    const meetingLocationLink = "";

    //notify user who sent the request originally
     newNotification(
      {
        type: "instant_meet_result_accepted",
        timestamp: Date.now(),
        content: JSON.stringify({
          link: meetingLocationLink,
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
        meetingLocationLink: ""
    });
}

module.exports = { acceptInstantMeetRequest };
