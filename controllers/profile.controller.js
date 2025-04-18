const validator = require('validator')

async function onboardUser(req, res) {
    try {
        //when onboarding a user, set display name, tags, profileDescription

        const { displayName, profileTagIds, profileDescription } = req.body;

        if (!displayName || !profileTagIds || !profileDescription) {
            return res.status(400).json({ success: false, message: "All fields are required" })
        }

        if (req.user.displayName || req.user.profileDescription) {
            console.log("User data: " + req.user.displayName + " " + req.user.profileDescription + " " + req.user.profileTags)
            return res.status(409).json({ success: false, message: "User has already been onboarded" })
        }

        if (!validator.isAlphanumeric(displayName, 'de-DE', { ignore: ' ' })) {
            return res.status(400).json({ success: false, message: "Please provide all the data in the required format" })
        }

        //TODO: Check whether profileDescription includes (malicious) code

        //TODO: Check whether every given TagId exists

        req.user.displayName = displayName;
        req.user.profileDescription = profileDescription;
        req.user.profileTags = profileTagIds;

        await req.user.save();

        return res.status(200).json({ success: true, message: "User has been onboarded successfully" })
    } catch (error) {
        console.log("Error in onboard user function", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }

}

async function ignoreSuggestedProfile(req, res) {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                success: false,
                error: "Username is required"
            })
        }

        const foundUser = await User.findOne({ username });
        if (!foundUser) {
            return res.status(404).json({ success: false, error: "User not found" });
        }
        const userId = foundUser._id;

        req.user.ignoredRecommendations.push(userId);
        await req.user.save();

        return res.status(200).json({
            success: true
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error
        })
    }
}

module.exports = { onboardUser, ignoreSuggestedProfile }