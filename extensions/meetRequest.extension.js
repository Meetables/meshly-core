const User = require("../models/user.models")
const { sendMeetingRequest } = require("./helpers/send-meeting-request.extension")

async function meetingRequest(req, res) {
    const {username, datetime, lat, lon} = req.body

    if (!username || !datetime || !lat || !lon) {
        //throw a 400
        return res.status(400).json({
            success: false,
            message: "Missing required fields: username, datetime, lat, lon"
        });
    }

    const targetUser = await User.findOne({username: username});

    sendMeetingRequest(req.user._id.toString(), targetUser._id, false, lat, lon, datetime).then(() => {
        //successful
        return res.sendStatus(204);
    }).catch(error => {
        //reutrn error
        console.error("Error in meetingRequest controller:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message || error
        });
    })

}

module.exports = {meetingRequest}