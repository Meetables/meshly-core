async function onboardUser(req, res) {
    try {
        //when onboarding a user, set display name, tags, profileDescription

        const { displayName, profileTagIds, profileDescription } = req.body;

        if (!displayName || !profileTagIds || !profileDescription) {
            return res.status(400).json({ success: false, message: "All fields are required" })
        }

        if (req.user.displayName || req.user.profileDescription || req.user.profileTags) {
            return res.status(409).json({ success: false, message: "User has already been onboarded" })
        }

        if (!validator.isAlphanumeric(displayName, 'de-DE', ' ')) {
            return res.status(400).json({ success: false, message: "Please provide all the data in the required format" })
        }

        //TODO: Check whether profileDescription includes (malicious) code

        //TODO: Check whether every given TagId exists

        req.user.displayName = displayName;
        req.user.profileDescription = profileDescription;
        req.user.profileTags = profileTagIds;

        await req.user.save();

        return res.status(200).json({success: true, message: "User has been onboarded successfully"})
    } catch (error) {
        console.log("Error in onboard user function", error.message);
		res.status(500).json({ success: false, message: "Internal server error" });
    }

}

module.exports = { onboardUser }