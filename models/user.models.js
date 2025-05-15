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

    stories: [{
        visibility: {
            type: String,
            enum: ['public', 'private', 'archived'],
            default: 'private'
        },

        contentType: {
            type: String,
            enum: ['text', 'image', 'video', 'encodedJSON'],
            default: 'text'
        },

        content: {
            type: String
        },

        timestampPosted: {
            type: Date,
            default: Date.now
        },

        timestampExpired: {
            type: Date
        },
    }],

    ignoredRecommendations: [
        {
            type: String
        }
    ],

    friends: [{
        uid: {
            type: String
        }
    }],

    lastLocation: {
        type: String
    },

    profilePictureUrl: {
        type: String
    },

    adminLoginToken: {
        type: String
    },

    notifications: [{
        type: {
            type: String,
            enum: ['friendRequest', 'friendRequestResponse'],
            required: true
        },

        pending: {
            type: Boolean,
            default: true
        },

        content: {
            type: String
        },

        timestamp: {
            type: Date,
            default: Date.now
        },
    }],

    uid: {
        type: String,
        unique: true,
        default: uuidv4
    }
})

const User = mongoose.model('User', userSchema)

module.exports = User;

