const { ENV_VARS } = require("../config/env-vars");
const Tag = require("../models/tag.models");
const User = require("../models/user.models");
const userGraph = require("../models/userGraph.models");

async function profileMatchingAlgorithm() {
    // Weighs similiarities between user profiles
    console.log("Never gonna give you up")
    if (ENV_VARS.REQUIRED_MATCHING_TAG_CATEGORY) {
        //Create a userGraph for each distinct tag from the REQUIRED_MATCHING_TAG_CATEGORY
        const locations = await Tag.distinct('_id', { category: ENV_VARS.REQUIRED_MATCHING_TAG_CATEGORY });
        console.log("locations:", locations);

        for (const locationId of locations) {
            const existingGraph = await userGraph.findById(locationId);
            if (!existingGraph) {
                const newUserGraph = new userGraph({ _id: locationId });
                await newUserGraph.save();
            }
        }
    } else {
        //Create one userGraph

    }

    const userQueue = await User.distinct('_id');

    for (let i = 0; i < userQueue.length; i++) {
        const userId = userQueue[i];

        for (let j = i + 1; j < userQueue.length; j++) {
            const userId_compareTarget = userQueue[j];
            console.log("Testing user: " + userId + " with user: " + userId_compareTarget);
        
            //Test how many of the specified interests from the source testant match with the destination
        }
    }
    

}

module.exports = profileMatchingAlgorithm;