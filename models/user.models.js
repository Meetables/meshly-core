const { mongoose } = require("mongoose");
const {v4: uuidv4} = require('uuid');
const { ENV_VARS } = require("../config/env-vars");

const baseNotificationTypes = ['friend_request', 'friend_request_response'];
const extraNotificationTypes = Array.isArray(ENV_VARS.EXTENSIONS_EXTRA_NOTIFICATIONTYPES)
    ? ENV_VARS.EXTENSIONS_EXTRA_NOTIFICATIONTYPES
    : [];
const allowedNotificationTypes = [...new Set([...baseNotificationTypes, ...extraNotificationTypes])];


const userSchema = mongoose.Schema({
    confirmed: {
        type: Boolean,
        default: false
    },

    clearance: {
        type: Number,
        enum: Object.values(ENV_VARS.USER_ROLES),
        required: true
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
        //is an object with 'lat' and 'lon'
        lat: {
            type: Number
        },
        lon: {
            type: Number
        }
    },

    notifications: [{
        type: {
            type: String,
            enum: allowedNotificationTypes,
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
    },

    auth2FA: {
        enabled: {
            type: Boolean,
            default: false
        },
        secret: {
            type: String //! ENCRYPT!!!
        },
    }
})

const User = mongoose.model('User', userSchema)

module.exports = User;

