//TODO: Make sure the weekdays only contain the timespan in a specific format, for example "14:00-16:00" to then check if the current time is between the start and end time of the json value

async function setAvailability(req, res) {
    try {
        const { mon, tue, wed, thu, fri, sat, sun } = req.body;

        if (!mon && !tue && !wed && !thu && !fri && !sat && !sun) {
            return res.status(400).json({
                success: false,
                error: "Availability is required"
            })
        }

        const user = req.user;

        //create a story for that user which includes content type 'encodedJSON' and content which is a json object with the days of the week as keys and the timespan as values
        const availability = {
            mon: mon || null,
            tue: tue || null,
            wed: wed || null,
            thu: thu || null,
            fri: fri || null,
            sat: sat || null,
            sun: sun || null
        }

        const newStory = {
            contentType: "encodedJSON",
            content: JSON.stringify(availability),
            visibility: "public",
            timestampPosted: Date.now()
        }

        user.stories.push(newStory);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Availability set successfully"
        })
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error
        })
    }
}

module.exports = {setAvailability};