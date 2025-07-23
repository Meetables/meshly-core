const { ENV_VARS } = require("../../config/env-vars");
const User = require("../../models/user.models");
const { setUserParam } = require("../../utils/setUserParam");
const { checkAvailability } = require("../helpers/checkAvailability.extensions");
const { sendMeetingRequest } = require("../helpers/send-meeting-request.extension");


async function meetingLookup(req, res) {
    try {
        const { lastLocation, matchingTags } = req.body;
        if (!lastLocation) {
            return res.status(400).json({
                success: false,
                error: "data required in valid format"
            })
        }

        await setUserParam(req.user, "lastLocation", req.body.lastLocation);

        console.log("User last location: " + req.user.lastLocation);

        let required_matching_category_tags = ENV_VARS.DEFAULT_TAGS.filter(tag => tag.category == ENV_VARS.REQUIRED_MATCHING_TAG_CATEGORY).map(tag => tag._id);
        let user_tags_matching_category = req.user.profileTags.filter(tag => required_matching_category_tags.includes(tag));
        console.log("User tags matching category: ", user_tags_matching_category);

        if (matchingTags) {
            //update user_tags_matching_category with matchingTags
            user_tags_matching_category = user_tags_matching_category.filter(tag => matchingTags.includes(tag));
        } 


        if (!user_tags_matching_category.length) {
            return res.status(400).json({
                success: false,
                error: "User doesn't have a " + ENV_VARS.REQUIRED_MATCHING_TAG_CATEGORY + " tag associated with his profile"
            })
        }

        console.log("🤠 Tags used in meetingLookup: ", user_tags_matching_category);

        meetingLookupAlgorithm(user_tags_matching_category, req.user._id).then(async (response) => {
            console.log("Response from meetingLookupAlgorithm: ", response);

            /* //set usedEndpoint.meetingLookup's value to the current date
             req.user.usedEndpoints.meetingLookup = new Date();
             await req.user.save(); */

            if (response.success) {
                return res.status(200).json({
                    success: true,
                    message: "Meeting requests sent successfully",
                    availableUserCounter: response.availableUserCounter
                })
            } else if (response.error == "No available users found") {
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
            console.log("Error in meetingLookupAlgorithm: " + error);
            return res.status(500).json({
                success: false,
                error: "Internal error"
            });
        }
        )

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error
        })

    }
}

//helper functions

async function meetingLookupAlgorithm(userProfileTagIds, userId) {
    try {
        console.log("User profile tags: ", userProfileTagIds);
        if (!ENV_VARS.REQUIRED_MATCHING_TAG_CATEGORY) {
            return { success: false, error: "Matching tag category not set" };
        }


        for (const id of userProfileTagIds) {
            const users = await User.find({ profileTags: id });
            const userQueue = users.map(user => user._id).filter(someUserId => !someUserId.equals(userId));

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
            console.log("Results of availability checks: ", results);
            const availableUsers = results.filter(Boolean);

            if (availableUsers.length > 0) {

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


module.exports = { meetingLookup };