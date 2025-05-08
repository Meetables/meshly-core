import { checkAvailability } from "./checkAvailability.extensions";
import { sendMeetingRequest } from "./send-meeting-request.extension";

//TODO: Check if done
export async function meetingLookup(req, res) {
    try {
        meetingLookupAlgorithm(req.user.profileTags, req.user._id).then((response) => {
            if (response.success) {
                return res.status(200).json({
                    success: true,
                    message: "Meeting request sent successfully"
                })
            } else {
                if (response.error === "User is not available") {
                    return res.status(200).json({
                        success: false,
                        comment: "User is not available"
                    })
                    
                } else if (response.error === "User not found") {
                    return res.status(404).json({
                        success: false,
                        error: "User not found"
                    })
                }

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

export async function meetingLookupAlgorithm(userProfileTagIds, userId) {

    try {
        if (ENV_VARS.REQUIRED_MATCHING_TAG_CATEGORY) {
            //For each location tag a user has set in their profile, return users with that same tag whose category equals the REQUIRED_MATCHING_TAG_CATEGORY   

            for (const id of userProfileTagIds) {
                const users = await User.find({ profileTags: id });

                const userQueue = users.map(user => user._id);

                if (userQueue.length === 0) {
                    console.log("No users found with tag: " + id);
                    return {
                        success: false,
                        error: "No users found with tag: " + id
                    }
                }

                for (let i = 0; i < userQueue.length; i++) {
                    const userFromQueueId = userQueue[i];

                    checkAvailability(userFromQueueId).then((availability) => {
                        if (availability.success) {
                            // Send meeting request to user
                            sendMeetingRequest(userId, userFromQueueId, true).then((response) => {
                                if (response.success) {
                                    console.log("Meeting request sent to user: " + userFromQueueId);
                                    return {
                                        success: true,
                                        message: "Meeting request sent successfully"
                                    }
                                } else {
                                    console.log("Error sending meeting request: " + response.error);
                                    return {
                                        success: false,
                                        error: response.error
                                    }
                                }
                            }).catch((error) => {
                                console.log("Error sending meeting request: " + error);

                                return {
                                    success: false,
                                    error: error
                                }
                            });
                        } else {
                            console.log("User is not available: " + userId);

                            return {
                                success: false,
                                error: "User is not available"
                            }
                        }
                    }).catch((error) => {
                        console.log("Error checking availability: " + error);
                    });
                }


            }
        }
    } catch (error) {
        console.log("Error in profileMatchingAlgoritm: " + error)
    }

}
