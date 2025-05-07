const { mongoose } = require("mongoose");
const {v4: uuidv4} = require('uuid');

const userSchema = mongoose.Schema({
    accountType: {
        type: String
    },

    username: {
        type: String,
        required: true,
        unique: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    displayName: {
        type: String
    },

    profileDescription: {
        type: String
    },

    profileTags: [
        {
            type: String
        }
    ],

    ignoredRecommendations: [
        {
            type: String
        }
    ],

    friendRequests: [{
        uid: {
            type: String
        },

        timestamp: {
            type: Date
        },

        pending: {
            type: Boolean
        }
    }],

    friends: [{
        uid: {
            type: String
        }
    }],

    profilePictureUrl: {
        type: String
    },

    adminLoginToken: {
        type: String
    },

    uid: {
        type: String,
        unique: true,
        default: uuidv4
    }
})

const User = mongoose.model('User', userSchema)

module.exports = User;

