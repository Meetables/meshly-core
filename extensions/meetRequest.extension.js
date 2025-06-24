const User = require("../models/user.models")
const { sendMeetingRequest } = require("./helpers/send-meeting-request.extension")

// Algrotihm suggesting a meeting time and location
async function suggestMeetingContext(req, res) {
    try {
        // [TODO] Implement the algorithm to suggest a meeting time and location

        //map out a time where both users are available

        
        
        return res.status(200).json({
            success: true,
            message: "Suggested meeting context is not implemented yet"
        });
    } catch (error) {
        console.error("Error in suggestedMeetingContext controller:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message || error
        });
    }
}

async function meetingRequest(req, res) {
    const {username, datetime, lat, lon} = req.body

    if (!username || !datetime || !lat || !lon) {
        //throw a 400
        return res.status(400).json({
            success: false,
            message: "Missing required fields: username, datetime, lat, lon"
        });
    }

    //make sure datetime is a valid date in the future
    const date = new Date(datetime);
    if (isNaN(date.getTime()) || date <= new Date()) {
        //throw a 400
        return res.status(400).json({
            success: false,
            message: "Invalid datetime value, must be a future date"
        });
    }

    //implement a check whether the lat/lon values are actually on earth
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return res.status(400).json({
            success: false,
            message: "Invalid latitude or longitude values"
        });
    }

    const targetUser = await User.findOne({username: username});

    if (!targetUser) {
        //throw a 404
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    if (targetUser._id.toString() === req.user._id.toString()) {
        //throw a 418
        return res.status(418).json({
            success: false,
            message: "You cannot send a meeting request to yourself"
        });
    }

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

module.exports = {meetingRequest, suggestMeetingContext}