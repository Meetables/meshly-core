const TIME_RANGE_REGEX = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/;

function validateTimeRanges(dayValue) {
    if (!dayValue) return true; // allow null or undefined
    const ranges = dayValue.split(',').map(r => r.trim());
    for (const range of ranges) {
        if (!TIME_RANGE_REGEX.test(range)) {
            return false;
        }
        const [start, end] = range.split('-');
        if (start >= end) {
            return false;
        }
    }
    return true;
}

async function setAvailability(req, res) {
    try {
        const { mon, tue, wed, thu, fri, sat, sun } = req.body;

        if (!mon && !tue && !wed && !thu && !fri && !sat && !sun) {
            return res.status(400).json({
                success: false,
                error: "Availability is required"
            });
        }

        const days = { mon, tue, wed, thu, fri, sat, sun };

        for (const [day, value] of Object.entries(days)) {
            if (!validateTimeRanges(value)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid time format for '${day}'. Use format "HH:MM-HH:MM" (24h), optionally comma-separated.`
                });
            }
        }

        const user = req.user;

        const availability = Object.fromEntries(
            Object.entries(days).map(([day, value]) => [day, value || null])
        );

        const newStory = {
            contentType: "encodedJSON",
            content: JSON.stringify(availability),
            visibility: "public",
            timestampPosted: Date.now()
        };

        user.stories.push(newStory);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Availability set successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message || error
        });
    }
}

module.exports = { setAvailability };
