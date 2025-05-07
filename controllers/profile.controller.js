const validator = require('validator');
const User = require('../models/user.models');

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

        return res.status(200).json({ success: true, message: "User has been onboarded successfully" })
    } catch (error) {
        console.log("Error in onboard user function", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }

}

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

        return res.status(200).json({
            success: true
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error
        })
    }
}

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

async function sendFriendRequest(req, res) {
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

        //push to target user's received friend requests
        foundUser.receivedFriendRequests.push({ sender: req.user._id, pending: true });
        await foundUser.save();

        //push to current user's sent friend requests
        req.user.sentFriendRequests.push({ receiver: userId, pending: true });
        await req.user.save();

        return res.status(200).json({
            success: true
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error
        })
    }
}

async function respondToFriendRequest(req, res) {
    try {
        const { username, status } = req.body;

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

        //modify the sender's friend request
        const friendRequest = foundUser.sentFriendRequests.find(request => request.sender.toString() === req.user._id.toString());
        
        if (!friendRequest) {
            return res.status(404).json({ success: false, error: "Friend request not found" });
        }
        
        friendRequest.pending = false;
        friendRequest.result = status + 'ed';
        
        await foundUser.save();
        
        newNotification({type: "friend_request", content: JSON.parse({user: req.user._id, result: status})}, userId)
        
        //save changes to current user's received friend requests
        const currentUserRequest = req.user.receivedFriendRequests.find(request => request.receiver.toString() === userId.toString());
        
        if (!currentUserRequest) {
            return res.status(404).json({ success: false, error: "Friend request not found" });
        }
        
        currentUserRequest.pending = false;
        currentUserRequest.result = status + 'ed';
        
        await req.user.save();

        return res.status(200).json({
            success: true
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error
        })
    }
}

async function newNotification(notification, userId){
        const { type, content } = notification;

        if (!type || !content) {
            return res.status(400).json({
                success: false,
                error: "Type and content are required"
            })
        }

        const newNotification = {
            type,
            timestamp: Date.now(),
            content,
            pending: true
        }
        //push notification to user
        const user = await User.findById(userId);

        if (!user) {
            return;
        }

        user.notifications.push(newNotification);

        await user.save();

        return {
            success: true
        }
}

async function getNotifications(req, res) {
    try {
        const notifications = req.user.notifications;

        if (!notifications || notifications.length === 0) {
            return res.status(200).json({
                success: true,
                notifications: []
            })
        }

        const formattedNotifications = notifications.map(notification => {
            return {
                type: notification.type,
                timestamp: notification.timestamp,
                content: notification.content,
                pending: notification.pending
            }
        });

        return res.status(200).json({
            success: true,
            notifications: formattedNotifications
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error
        })
    }
}

module.exports = { onboardUser, ignoreSuggestedProfile, createNewStory, sendFriendRequest, respondToFriendRequest, getNotifications }