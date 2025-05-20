const User = require("../models/user.models")

const setUserParam = async (user, key, value) => {

    try {
        user[key] = value;

        await user.save();

        return {
            success: true,
            message: `User parameter ${key} set to ${value}`
        }
    } catch (error) {
        console.log("Error setting user parameter: ", error);
    }
}

module.exports = { setUserParam };