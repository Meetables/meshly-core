const Tag = require("../models/tag.models");

async function getTags(req, res) {
    try {
        const tags = await Tag.find({});
        return res.status(200).json({
            success: true,
            data: tags
        });
    } catch (err) {
        console.error('Error fetching tags:', err);
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
}

module.exports = {getTags};