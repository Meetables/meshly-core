//import required models
const Tag = require("../models/tag.models");
const User = require("../models/user.models");
const { ENV_VARS } = require("../config/env-vars");
const { get } = require("mongoose");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { fileClient, fileBucket } = require("../file-backend/connect");
const userProfileSuggestion = require("../models/userSuggestions.model");

async function getTags(req, res) {
    try {
        const tags = await Tag.find({});
        return res.status(200).json({
            success: true,
            data: tags
        });
    } catch (err) {
        console.error('Error fetching tags:', err);
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
}

/**
 * get profile data
 */

async function getPublicProfileData(req, res) {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                success: false,
                error: "Username is required"
            })
        }

        const user = await User.findOne({ username: username });

        // When user not found, return a 404
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            })
        }

        return res.status(200).json({
            success: true,
            user: {
                username: username,
                displayName: user.displayName,
                profileDescription: user.profileDescription,
                profileTags: user.profileTags
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

/**
 * get friend recommendations stored in db
 */
async function getFriendRecommendations(req, res) {
    try {

        const { max_suggestions } = req.body;

        if (!max_suggestions) {
            return res.status(400).json({ success: false, message: "All fields are required" })
        }

        const _suggestions = await userProfileSuggestion.find({
            nodes: { $in: [req.user._id] }
        }).sort({ timestamp: -1 }); //sort by timestamp, most recent first

        // If there are no suggestions, return a success message containing no suggestions

        if (_suggestions.length === 0) {
            return res.status(200).json({
                success: true,
                recommendations: []
            });
        }

        let recommendations = [];

        //transform recommendations to an array, sorted by the weight

        for (const _suggestion of _suggestions) {
            let recommendation = {};

            const username = (await User.findById(
                _suggestion.nodes.filter(userId => userId != req.user._id)[0]
            )).username;

            recommendation.username = username;

          /*  
          DEBUGGING ONLY
            console.log("Recommendation scores: ", _suggestion.scores);
            console.log("Active user's tags: ", req.user.profileTags)
            const otherUserTags = await User.findById(_suggestion.nodes.filter(userId => userId != req.user._id)[0])
                .then(user => user.profileTags)
                .catch(err => {
                    console.error("Error fetching other user's tags:", err);
                    return [];
                });
            console.log("other user's tags: ", otherUserTags);
            */
            recommendation.score = _suggestion.scores.get(req.user._id);

            recommendation.type = {};

            recommendation.timestamp = _suggestion.timestamp;

            if (_suggestion.timestamp > new Date(Date.now() - ENV_VARS.PROFILE_SUGGESTION_NEW_THRESHOLD_HOURS * 60 * 60 * 1000)) {
                recommendation.type.new = true
            }

            if (recommendation.score > ENV_VARS.PROFILE_SUGGESTION_HOT_THRESHOLD) {
                recommendation.type.hot = true
            }

            recommendations.push(recommendation);

        }

        recommendations.sort((a, b) => b.score - a.score);

        return res.status(200).json({
            success: true,
            recommendations: recommendations.slice(0, max_suggestions)
        });

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

async function getProfilePicture(req, res) {
    let userId = req.query.userId || req.user._id; // Use the userId from query or fall back to authenticated user
    const username = req.query.username;
    
    if (!userId && !username) {
        return res.status(400).json({ success: false, message: "Missing userId or username" });
    }

    if (username) {
        const user = await User.findOne({ username: username }).select('_id');
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        userId = user._id; 
    }

    try {
        const key = `profile-pictures/${userId}`;

        const command = new GetObjectCommand({
            Bucket: fileBucket,
            Key: key,
        });

        const s3Response = await fileClient.send(command);

        console.log("S3 cotent type:", s3Response.ContentType);
        res.setHeader('Content-Type', s3Response.ContentType || 'image/jpeg'); // default fallback
        res.setHeader('Content-Length', s3Response.ContentLength);

        s3Response.Body.pipe(res);
    } catch (error) {
        console.error("Failed to fetch profile picture:", error);
        res.status(404).json({ success: false, message: "Profile picture not found" });
    }
}

async function userLookup(req, res) {
    try {
        const { query, maxResults } = req.body; //maxResults: optional number bigger than 0

        if (!query || typeof query !== 'string' || query.trim() === '') {
            return res.status(400).json({ success: false, message: "Query is required and must be a non-empty string" });
        }

        //if query includes an @, make sure something is in front of it
        if (query.includes('@') && query.startsWith('@')) {
            return res.status(400).json({ success: false, message: "Invalid query format" });
        }

        let usersMatchingQuery = await User.find({
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { displayName: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
                { profileDescription: { $regex: query, $options: 'i' } },
                { profileTags: { $regex: query, $options: 'i' } }
            ]
        }).select('_id username displayName profileDescription profileTags');

        usersMatchingQuery = usersMatchingQuery.map(user => ({
            userId: user._id,
            username: user.username,
            displayName: user.displayName,
            profileDescription: user.profileDescription,
            profileTags: user.profileTags
        }));

        if (usersMatchingQuery.length === 0) {
            return res.status(404).json({ success: false, message: "No users matching the query" });
        }

        // Limit results if maxResults is provided

        if (maxResults && !isNaN(maxResults)) {
            return res.status(200).json({
                success: true,
                users: usersMatchingQuery.slice(0, parseInt(maxResults))
            });
        }

        return res.status(200).json({ success: true, users: usersMatchingQuery });

    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = { userLookup, getTags, getPublicProfileData, getFriendRecommendations, getProfilePicture };