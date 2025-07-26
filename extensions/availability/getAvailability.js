
async function getAvailability(req, res) {
    try {
        console.log("Checking availability for user: " + req.user._id);

        const stories = req.user.stories;
        if (stories.length === 0) {
            return {
                success: false,
                error: "No stories found"
            };
        }

        const latestStory = stories[stories.length - 1];

        if (latestStory.contentType !== "encodedJSON") {
            return {
                success: false,
                error: "Latest story is not of type 'encodedJSON'"
            };
        }

        const jsonContent = JSON.parse(latestStory.content);
        const weekdays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

        const availability = {};
        for (const day of weekdays) {
            availability[day] = jsonContent[day] || null;
        }

        console.log(availability)

        return res.status(200).json({
            success: true,
            availability
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message || error
        });
    }
}

module.exports = { getAvailability };
