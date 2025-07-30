const { mongoose } = require("mongoose");
const { v4: uuidv4 } = require('uuid');

const userProfileSuggestionSchema = mongoose.Schema({
    nodes: [{
        type: String
    }],

    weight: {
        type: Number,
        required: true
    },

    scores: {
        type: Map,
        of: Number
    },

    timestamp: {
        type: Date
    },

    algorithmRunId: {
        type: String,
        required: true
    }
}
);

const userProfileSuggestion = mongoose.model('userProfileSuggestion', userProfileSuggestionSchema);

module.exports = userProfileSuggestion;