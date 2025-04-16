const { ENV_VARS } = require("../config/env-vars");
const Tag = require("../models/tag.models");
const User = require("../models/user.models");
const userGraph = require("../models/userGraph.models");

async function profileMatchingAlgorithm() {
    // Weighs similiarities between user profiles

    try {
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
    
                const userQueue = await User.distinct('_id', { profileTags: locationId });
                
                for (let i = 0; i < userQueue.length; i++) {
                    const userId = userQueue[i];
    
                    for (let j = i + 1; j < userQueue.length; j++) {
                        const userId_compareTarget = userQueue[j];
                        console.log("Testing user: " + userId + " with user: " + userId_compareTarget);
                        const compareUser = await User.findById(userId)
                        const user_compareTarget = await User.findById(userId_compareTarget)
    
                        //Test how many of the specified interests from the source testant match with the destination
                        const commonTags = compareUser.profileTags.filter(element => !locations.includes(element) && user_compareTarget.profileTags.includes(element)).length;
                        
                        const scores = {
                            [userId]: commonTags / compareUser.profileTags.filter(element => !locations.includes(element)).length,
                            [userId_compareTarget]: commonTags / user_compareTarget.profileTags.filter(element => !locations.includes(element)).length
                        }

                        await addEdgeToUserGraph(locationId, {nodes: [userId, userId_compareTarget], weight: commonTags, scores: scores})
                        //write the score to db
                    }
                }
    
            }
        } else {
            // [TODO] in case no matching tag is required, test everyone
            //Create one userGraph
    
        }
    } catch (error) {
        console.log("Error in profileMatchingAlgoritm: " + error)
    }

}

/**
     * Adds an edge between two user nodes to the specified UserGraph
     */
async function addEdgeToUserGraph(userGraphId, newEdge) {
    
    try {
       const graph = await userGraph.findById(userGraphId);

        if (!graph) {
            throw new Error('User graph not found');
        }
     
        const existingEdgeIndex = graph.edges.findIndex(edge => 
            edge.nodes.includes(newEdge.nodes[0]) && edge.nodes.includes(newEdge.nodes[1])
        );

        if (existingEdgeIndex !== -1) {
            // Replace existing edge
            graph.edges[existingEdgeIndex] = {
                nodes: newEdge.nodes,
                weight: newEdge.weight,
                scores: newEdge.scores
            };
            console.log('Edge updated successfully:', graph.edges[existingEdgeIndex]);
        } else {
            // Add new edge
            const edge = {
                nodes: newEdge.nodes,
                weight: newEdge.weight,
                timestamp: Date.now,
                scores: newEdge.scores
            };
            graph.edges.push(edge);
            console.log('Edge added successfully:', edge);
        }

        // Save updated graph
        await graph.save();
    } catch (error) {
        console.log('Error adding edge to user graph:', error);
    }
}

module.exports = profileMatchingAlgorithm;