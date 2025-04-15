const { mongoose } = require("mongoose");
const { v4: uuidv4 } = require('uuid');

const userGraphSchema = mongoose.Schema({
    edges: [
        {
            nodes: [{
                type: String
            }],

            weight: {
                type: Number,
                required: true
            }
        }
    ]
});

const userGraph = mongoose.model('userGraph', userGraphSchema);

module.exports = userGraph;