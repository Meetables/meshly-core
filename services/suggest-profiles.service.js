const { ENV_VARS } = require("../config/env-vars");
const Tag = require("../models/tag.models");
const User = require("../models/user.models");
const userProfileSuggestion = require("../models/userSuggestions.model");

async function profileMatchingAlgorithm() {
    // Weighs similiarities between user profiles

    try {
        const algroithm_runid = crypto.randomUUID();
        if (ENV_VARS.REQUIRED_MATCHING_TAG_CATEGORY) {
            const locations = await Tag.distinct('_id', { category: ENV_VARS.REQUIRED_MATCHING_TAG_CATEGORY });

            for (const locationId of locations) {
                // for creating the queue, get every user that has the locationId in their profileTags
                const userQueue = await User.distinct('_id', { profileTags: locationId });

                //then filter out those users pairs that have already been tested in this run

                for (let i = 0; i < userQueue.length; i++) {
                    const userId = userQueue[i];

                    for (let j = i + 1; j < userQueue.length; j++) {
                        const userId_compareTarget = userQueue[j];

                        //Test whether they've already been engaged with each other
                        const compareUser = await User.findById(userId)
                        const user_compareTarget = await User.findById(userId_compareTarget)

                        if (
                            (compareUser.friends && compareUser.friends.includes(userId_compareTarget)) || //They're already befriended
                            (compareUser.sentFriendRequests && compareUser.sentFriendRequests.find(request => request.receiver == userId_compareTarget)) || // user has sent compare_target user a friend request
                            (user_compareTarget.sentFriendRequests && user_compareTarget.sentFriendRequests.find(request => request.receiver == userId)) || // compare_target user has sent user a friend request
                            (compareUser.ignoredRecommendations && compareUser.ignoredRecommendations.includes(userId_compareTarget)) || // user has ignored compare_target user
                            (user_compareTarget.ignoredRecommendations && user_compareTarget.ignoredRecommendations.includes(userId)) // compare_target user has ignored user
                        ) {
                            //don't compare them
                            console.log("Skipping comparison beetween users: " + userId + " and user " + userId_compareTarget);
                        } else {

                            const commonTags = await returnCommonTags(userId, userId_compareTarget, locations);

                            if (commonTags != -1) {
                                //write the score to db

                                const scores = new Map();
                                scores.set(userId.toString(), commonTags / compareUser.profileTags.filter(element => !locations.includes(element)).length)
                                scores.set(userId_compareTarget.toString(), commonTags / user_compareTarget.profileTags.filter(element => !locations.includes(element)).length);

                                //test whether an existing userSuggestion from the same run already exists
                                const existingSuggestion_samerun = await userProfileSuggestion.findOne({
                                    nodes: { $all: [userId, userId_compareTarget] },
                                    algorithmRunId: algroithm_runid
                                });

                                if (existingSuggestion_samerun) {
                                    console.log("Skipping comparison beetween users (it has been performed already for this run): " + userId + " and user " + userId_compareTarget);
                                    return;
                                }

                                const existingSuggestion = await userProfileSuggestion.findOne({
                                    nodes: { $all: [userId, userId_compareTarget] }
                                });

                                if (
                                    existingSuggestion &&
                                    JSON.stringify(Object.fromEntries(existingSuggestion.scores)) == JSON.stringify(Object.fromEntries(scores))
                                ) {
                                    console.log("Skipping comparison beetween users (it has been performed already): " + userId + " and user " + userId_compareTarget);
                                    return;

                                } else if (existingSuggestion) {
                                    //Update the existing suggestion with the new score
                                    existingSuggestion.scores[userId] = scores.get(userId);
                                    existingSuggestion.scores[userId_compareTarget] = scores.get(userId_compareTarget);
                                    existingSuggestion.weight = commonTags;
                                    existingSuggestion.algorithmRunId = algroithm_runid;
                                    existingSuggestion.timestamp = Date.now();
                                    await existingSuggestion.save();
                                    console.log("Updated existing edge between users: " + userId + " and user " + userId_compareTarget + " with score: " + commonTags);
                                    return;
                                }

                                const newSuggestion = new userProfileSuggestion({
                                    nodes: [userId, userId_compareTarget],
                                    scores: scores,
                                    weight: commonTags,
                                    algorithmRunId: algroithm_runid
                                });

                                await newSuggestion.save();

                                console.log("Added edge between users: " + userId + " and user " + userId_compareTarget + " with score: " + commonTags);
                            }
                        }

                    }
                }

            }
        } else {
            // [TODO] in case no matching tag is required, test every one
            //Create one userGraph

        }
    } catch (error) {
        console.log("Error in profileMatchingAlgoritm: " + error)
    }

}

async function returnCommonTags(userId, userId_compareTarget, toExcludeFromMatching) {
    console.log("Testing user: " + userId + " with user: " + userId_compareTarget);
    const compareUser = await User.findById(userId)
    const user_compareTarget = await User.findById(userId_compareTarget)

    //Test whether they've already been engaged with each other
    if (
        (compareUser.friends && compareUser.friends.includes(userId_compareTarget)) ||
        (compareUser.friendRequests && compareUser.friendRequests.find(request => request.uid == userId_compareTarget)) ||
        (user_compareTarget.friendRequests && user_compareTarget.friendRequests.find(request => request.uid == userId)) ||
        (compareUser.ignoredRecommendations && compareUser.ignoredRecommendations.includes(userId_compareTarget)) ||
        (user_compareTarget.ignoredRecommendations && user_compareTarget.ignoredRecommendations.includes(userId))
    ) {
        return -1;
    }

    //Test how many of the specified interests from the source testant match with the destination
    const commonTags = compareUser.profileTags.filter(element => !toExcludeFromMatching.includes(element) && user_compareTarget.profileTags.includes(element)).length;

    return commonTags;
}

module.exports = profileMatchingAlgorithm;