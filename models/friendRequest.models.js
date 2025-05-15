const { mongoose } = require("mongoose");
const { v4: uuidv4 } = require('uuid');

const FriendRequestSchema = mongoose.Schema({
    sender: {
        type: String
    },

    receiver: {
        type: String
    },

    timestamp: {
        type: Date,
        default: Date.now
    },

    pending: {
        type: Boolean
    },

    result: {
        type: String,
        enum: ['accepted', 'rejected']
    },

    comment: {
        type: String
    }
})

const FriendRequest = mongoose.model('FriendRequest', FriendRequestSchema)

module.exports = FriendRequest;

