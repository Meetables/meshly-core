const validator = require('validator');
const User = require('../../models/user.models');
const { getNotifications, newNotification } = require('./notifications');
const { sendFriendRequest, getFriendRequests, respondToFriendRequest } = require('./friendManagement');

//return public user data
async function getPublicProfileData(req, res){
    try {
  
        return res.status(200).json({
            success: true,
            user: {
                username: req.user.username,
                displayName: req.user.displayName,
                profileDescription: req.user.profileDescription,
                profileTags: req.user.profileTags
            }
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

//user onboarding function

async function onboardUser(req, res) {
    try {
        //when onboarding a user, set display name, tags, profileDescription

        const { displayName, profileTagIds, profileDescription } = req.body;

        if (!displayName || !profileTagIds || !profileDescription) {
            return res.status(400).json({ success: false, message: "All fields are required" })
        }

        if (req.user.displayName || req.user.profileDescription) {
            console.log("User data: " + req.user.displayName + " " + req.user.profileDescription + " " + req.user.profileTags)
            return res.status(409).json({ success: false, message: "User has already been onboarded" })
        }

        if (!validator.isAlphanumeric(displayName, 'de-DE', { ignore: ' ' })) {
            return res.status(400).json({ success: false, message: "Please provide all the data in the required format" })
        }

        //TODO: Check whether profileDescription includes (malicious) code

        //TODO: Check whether every given TagId exists

        req.user.displayName = displayName;
        req.user.profileDescription = profileDescription;
        req.user.profileTags = profileTagIds;

        await req.user.save();

        return res.status(204);
    } catch (error) {
        console.log("Error in onboard user function", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }

}

//reject suggested profiles

async function ignoreSuggestedProfile(req, res) {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                success: false,
                error: "Username is required"
            })
        }

        const foundUser = await User.findOne({ username });
        if (!foundUser) {
            return res.status(404).json({ success: false, error: "User not found" });
        }
        const userId = foundUser._id;

        req.user.ignoredRecommendations.push(userId);
        await req.user.save();

        return res.status(204);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error
        })
    }
}

//story functions

//TODO: Validate openapi.yaml
async function createNewStory(req, res) {
    try {
        const { content, contentType, visibility, updatePrev } = req.body;

        if (!content || !contentType || !visibility) {
            return res.status(400).json({ success: false, message: "All fields are required" })
        }

        if (req.user.stories.length > 0 && updatePrev) {
            //archive past stories
            req.user.stories.forEach(story => {

                if (story.visibility === "archived") {
                    return;
                }

                story.visibility = "archived";
                story.timestampExpired = Date.now();
            })
        }

        req.user.stories.push({
            content,
            contentType,
            visibility,
            timestampPosted: Date.now()
        });

        await req.user.save();

        return res.status(200).json({ success: true, message: "Story created successfully" })
    } catch (error) {
        console.log("Error in create new story function", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

module.exports = { onboardUser, ignoreSuggestedProfile, createNewStory, sendFriendRequest, respondToFriendRequest, getFriendRequests, getNotifications, getPublicProfileData }