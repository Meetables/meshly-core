const User = require("../models/user.models")
const { sendMeetingRequest } = require("./helpers/send-meeting-request.extension")

async function meetingRequest(req, res) {
    const {username, datetime, lat, lon} = req.body

    if (!username || !datetime || !lat || !lon) {
        //throw a 400
    }

    const targetUser = await User.findOne({username: username});

    sendMeetingRequest(req.user._id.toString(), targetUser._id, false, lat, lon, datetime).then(() => {
        //successful
    }).catch(error => {
        //reutrn error
    })

}

module.exports = {meetingRequest}