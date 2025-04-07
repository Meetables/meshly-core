const mongoose = require("mongoose");

const tagSchema = mongoose.Schema({
    icon: {
        type: String
    },

    name: {
        type: String,
        required: true
    },

    superTag: {
        type: String
    }
})

const Tag = mongoose.model('tag', tagSchema);

module.exports = Tag;

