const User = require("../models/user.models")

const setUserParam = async (user, key, value) => {
 
    user[key] = value;

    await user.save();

    console.log("User parameter set: ", userId, key, value);

    return {
        success: true,
        message: `User parameter ${key} set to ${value}`
    }
}

module.exports = {setUserParam};