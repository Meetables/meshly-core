const { ENV_VARS } = require("../config/env-vars");
const User = require("../models/user.models");
const { checkAvailability } = require("./checkAvailability.extensions");
const { sendMeetingRequest } =  require("./send-meeting-request.extension");


async function meetingLookup(req, res) {
    try {
        meetingLookupAlgorithm(req.user.profileTags, req.user._id).then((response) => {
            if (response.success) {
                return res.status(200).json({
                    success: true,
                    message: "Meeting requests sent successfully",
                    availableUserCounter: response.availableUserCounter
                })
            } else if (response.error == "No available users found"){
                return res.status(200).json({
                    success: false,
                    error: response.error
                })
            } else {
                return res.status(500).json({
                    success: false,
                    error: response.error
                })
            }
        }).catch((error) => {
            return res.status(500).json({
                success: false,
                error: error
            })
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error
        })

    }
}
async function meetingLookupAlgorithm(userProfileTagIds, userId) {
    try {
        if (!ENV_VARS.REQUIRED_MATCHING_TAG_CATEGORY) {
            return { success: false, error: "Matching tag category not set" };
        }

        for (const id of userProfileTagIds) {
            const users = await User.find({ profileTags: id });
            const userQueue = users.map(user => user._id);

            if (userQueue.length === 0) {
                console.log("No users found with tag: " + id);
                continue;
            }

            const availabilityChecks = userQueue.map(async (userFromQueueId) => {
                try {
                    const availability = await checkAvailability(userFromQueueId);
                    if (availability.success) {
                        const response = await sendMeetingRequest(userId, userFromQueueId, true);
                        if (response.success) {
                            console.log("Meeting request sent to user: " + userFromQueueId);
                            return true;
                        } else {
                            console.log("Error sending meeting request: " + response.error);
                        }
                    }
                } catch (err) {
                    console.log("Error during availability or sending: " + err);
                }
                return false;
            });

            const results = await Promise.all(availabilityChecks);
            const availableUsers = results.filter(Boolean);

            if (availableUsers.length > 0) {

                //TODO: Notify users

                return {
                    success: true,
                    message: "Meeting requests sent successfully",
                    availableUserCounter: availableUsers.length
                };
            }
        }

        return {
            success: false,
            error: "No available users found"
        };
    } catch (error) {
        console.log("Error in meetingLookupAlgorithm: " + error);
        return {
            success: false,
            error: "Internal error"
        };
    }
}


module.exports = {meetingLookup};