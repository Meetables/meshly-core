const User = require("../models/user.models")

const setUserParam = async (userId, key, value) => {
    const user = await User.findById(userId);

    user[key] = value;

    await user.save();

    return {
        success: true,
        message: `User parameter ${key} set to ${value}`
    }
}

module.exports = {setUserParam};