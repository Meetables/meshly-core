// Service for running healthchecks

const Tag = require("../models/tag.models");
const User = require("../models/user.models");

// test whether the server is running, there are users and tags 
async function runHealthcheck(){
    try {

        const Users = await User.countDocuments();

        if (Users === null || Users === undefined) {
            return {
                status: "error",
                message: "Healthcheck failed: No users found",
                data: null
            };
        }

        const Tags = await Tag.countDocuments()

        if (Tags === null || Tags === undefined) {
            return {
                status: "error",
                message: "Healthcheck failed: No tags found",
                data: null
            };
        }
        
        return {
            status: "ok",
            message: "Healthcheck passed",
            data: {
                timestamp: new Date().toISOString(),
                serverStatus: "running",
                userCount: Users,
                tagCount: Tags
            }
        };
    } catch (error) {
        return {
            status: "error",
            message: "Healthcheck failed",
            error: error.message || "Unknown error"
        };
    }
}

module.exports = { runHealthcheck };