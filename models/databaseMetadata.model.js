const mongoose = require("mongoose");

//TODO: Add an id, encoded Name for clearer creation and retrieval

const databaseMetadataSchema = mongoose.Schema({
    dbInitTimestamp: {
        type: Date,
        default: Date.now
    },
    userCounter: {
        type: Number,
        default: 0
    },
    tagCounter: {
        type: Number,
        default: 0
    }
});

const MetadataItem = mongoose.model('MetadataItem', databaseMetadataSchema);

async function getInternalMetadata() {
    let doc = await MetadataItem.findOne();
    if (!doc) {
        doc = await MetadataItem.create({});
    }
    return doc;
}

module.exports = {
    MetadataItem,
    getInternalMetadata
};