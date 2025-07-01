const { ENV_VARS } = require('../config/env-vars');
const User = require('../models/user.models');


// all functions return this format: { success: <bool>, outcome: { status: <HTTP code>, result: <data> } }


const getUserByIndividualFeatures = async ({ uid, username, email }, leaveout) => {
    if (!uid && !username && !email) {
        return {success: false, outcome: {status: 400, result: {message: "At least one of uid, username, or email is required"}}};
    }

    let query = {};
    if (username !== undefined) query.username = username;
    if (uid !== undefined) query.uid = uid;
    if (email !== undefined) query.email = email;

    let user;
    try {
        if (leaveout) {
            user = await User.findOne(query).select("-" + leaveout.join(" -"));
        } else {
            user = await User.findOne(query)
        }
    } catch (err) {
        console.error("Database error:", err);
        return {success: false, outcome: {status: 500, result: {message: "Internal server error"}}};
    }
    if (!user) {
        return {success: false, outcome: {status: 404, result: {message: "User not found"}}};
    }

    return {success: true, outcome: {status: 200, result: {user}}};
}


const getUserByMongoID = async (_id, leaveout) => {
    if (!_id) {
        return {success: false, outcome: {status: 400, result: {message: "mongodb _id is missing"}}};
    }

    let user;
    try {
        user = leaveout && Array.isArray(leaveout) && leaveout.length > 0
            ? await User.findById(_id).select("-" + leaveout.join(" -"))
            : await User.findById(_id);
    } catch (err) {
        return {success: false, outcome: {status: 500, result: {message: "Internal server error"}}};
    }
    if (!user) {
        return {success: false, outcome: {status: 404, result: {message: "User not found"}}};
    }

    return {success: true, outcome: {status: 200, result: {user}}};
}


const changeUserAttributes = async (user, change) => {
    if (!user || !change) {
        return {success: false, outcome: {status: 400, result: "User and change data are required"}};
    }

    if (Object.keys(change).some(key => ENV_VARS.DISALLOWED_USER_CHANGES.includes(key))) {
        return {success: false, outcome: {status: 403, result: `Changing the following fields is not allowed: ${ENV_VARS.DISALLOWED_USER_CHANGES.join(', ')}`}};
    }

    try {
        Object.assign(user, change);
        await user.save();
        return {success: true, outcome: {status: 200, result: {user: user._doc}}};
    } catch (err) {
        console.error(`Error updating user changes (${change}):`, err);
        return {success: false, outcome: {status: 500, result: {message: "Internal server error"}}};
    }
}


const mongo2object = (mongoDocument, removeKeys) => {
    if (!mongoDocument) {
        console.log("mongo2object: mongoDocument is null or undefined");
        return {success: false, outcome: {status: 500, result: {message: "Internal server error"}}};
    }
    if (removeKeys && !Array.isArray(removeKeys)) {
        console.log("mongo2object: removeKeys is not an array");
        return {success: false, outcome: {status: 500, result: {message: "Internal server error"}}};
    }

    try {
        let obj = { ...mongoDocument._doc };
        if (removeKeys) {
            removeKeys.forEach(key => {
                delete obj[key];
            });
        }
        return {success: true, outcome: {status: 200, result: {user: obj}}};
    } catch (err) {
        console.error("mongo2object error:", err);
        return {success: false, outcome: {status: 500, result: {message: "Internal server error"}}};
    }
}



module.exports = {
    getUserByIndividualFeatures,
    getUserByMongoID,           // Add this
    changeUserAttributes,
    mongo2object
};
