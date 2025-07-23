const filterUserDto = async (req, res, next) => {
    try {
        const user = req.user._doc;

        const filteredUser = {
            ...('_id' in user && { _id: user._id }),
            ...('username' in user && { username: user.username }),
            ...('email' in user && { email: user.email }),
            ...('displayName' in user && { displayName: user.displayName }),
            ...('profileDescription' in user && { profileDescription: user.profileDescription }),
            ...('profileTags' in user && { profileTags: user.profileTags }),
            ...('ignoredUserIds' in user && { ignoredUserIds: user.ignoredUserIds }),
            ...(
                'lastLocation' in user &&
                typeof user.lastLocation === 'object' &&
                user.lastLocation !== null &&
                { lastLocation: user.lastLocation }
            ),
             ...('status' in user && { status: user.status }),
                  ...('__v' in user && { __v: user.__v }),
        };
        req.user = filteredUser;
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = { filterUserDto };