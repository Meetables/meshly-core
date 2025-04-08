const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs')

const { ENV_VARS } = require('../config/env-vars');
const User = require('../models/user.models');


async function initDb() {
    //create sample user

    const userCount = await User.countDocuments();
    console.log(`User count (startup): ${userCount}`);


    if (userCount === 0) {
        if (ENV_VARS.DEV_TESTUSER_EMAIL && ENV_VARS.DEV_TESTUSER_USERNAME && ENV_VARS.DEV_TESTUSER_PASSWORD) {
            const salt = await bcryptjs.genSalt(10);
            const hashedPassword = await bcryptjs.hash(ENV_VARS.DEV_TESTUSER_PASSWORD, salt);
    
            const newUser = new User({
                email: ENV_VARS.DEV_TESTUSER_EMAIL,
                password: hashedPassword,
                username: ENV_VARS.DEV_TESTUSER_USERNAME
            })
    
            await newUser.save();
            console.log("Created test user")
        } else {
            console.log("Error in dbInit: test user can't be created")
        } 
    } else {
        console.log("Database already initialized")
    }

    


    //create tags: location, interest

}

module.exports = initDb;