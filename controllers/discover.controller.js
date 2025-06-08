//import required models
const Tag = require("../models/tag.models");
const User = require("../models/user.models");
const userGraph = require("../models/userGraph.models");
const { ENV_VARS } = require("../config/env-vars");



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

        const edges = await getEdgesByUserId(req.user._id);

        //TODO: If there are no edges, return a success message containing no suggestions

        if (!edges) {
            return res.status(200).json({
                success: true,
                recommendations: 0
            });
        }

        let recommendations = [];

        //transform recommendations to an array, sorted by the weight

        for (const edge of edges) {
            let recommendation = {};

            const username = (await User.findById(
                edge.nodes.filter(userId => userId != req.user._id)[0]
            )).username;

            recommendation.user = username;

            recommendation.score = edge.scores.get(req.user._id);

            recommendation.type = {};

            if (edge.timestamp > new Date(Date.now() - ENV_VARS.PROFILE_SUGGESTION_NEW_THRESHOLD_HOURS * 60 * 60 * 1000)) {
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

async function getEdgesByUserId(userId) {
    try {
        const graphs = await userGraph.find({
            edges: { $elemMatch: { nodes: userId } }
        });

        if (graphs.length > 0) {
            const edgesInvolvingUser = graphs.flatMap(graph =>
                graph.edges.filter(edge => edge.nodes.includes(userId))
            );

            return edgesInvolvingUser;
        } else {
            console.log(`No edges found for userId ${userId}.`);
            return [];
        }
    } catch (error) {
        console.error('Error retrieving edges:', error);
    }
}


module.exports = { getTags, getPublicProfileData, getFriendRecommendations };