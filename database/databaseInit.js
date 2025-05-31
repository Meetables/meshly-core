const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs')

const { ENV_VARS } = require('../config/env-vars');
const User = require('../models/user.models');
const Tag = require('../models/tag.models');


async function initDb() {
    //create sample user

    const userCount = await User.countDocuments();
    console.log(`User count (startup): ${userCount}`);

    if (userCount === 0) {
        //create testuser
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

        //Test for present admin user, if not present print a token to console
        if (!(await User.findOne({accountType: "admin"}))) {
            //create admin user "blueprint", log token
            const adminLoginToken = crypto.randomUUID();

            const salt = await bcryptjs.genSalt(10);
            const hashedPassword = await bcryptjs.hash(adminLoginToken, salt);

            const newUser = new User({
                email: ENV_VARS.DEV_ADMINUSER_EMAIL,
                password: hashedPassword,
                username: "admin"
            })

            await newUser.save();

            console.log("Adminuser token: " + adminLoginToken)
        } else {
            
        }
    } else {
        console.log("Database already initialized")
    }

    //create tags: location, interest

    const tagCount = await Tag.countDocuments();

    if (tagCount == 0) {
        await Tag.insertMany(ENV_VARS.DEFAULT_TAGS);
        console.log("tags inserted")
    } else {
        console.log("Tag count in DB: " + tagCount)
    }
}

module.exports = initDb;