const User = require('../models/user.models');



async function getUser(req, res) {
    const userInfo = {
        id: req.query.id,
        email: req.query.email,
        username: req.query.username,
        uid: req.query.uid
    }

    if (!userInfo.id && !userInfo.email && !userInfo.username) {
        return res.status(400).json({ success: false, message: "Missing user information" });
    }

    const query = {};
    if (userInfo.id) query._id = userInfo.id;
    if (userInfo.email) query.email = userInfo.email;
    if (userInfo.username) query.username = userInfo.username;
    if (userInfo.uid) query.uid = userInfo.uid;

    const user = await User.findOne(query);

    if (!user) {
        return res.status(404).json({ success: "false", message: "User not found" });
    }



    res.status(200).json({
        success: "true",
        user
    });
}

async function getUsers(req, res) {
    //! implement filtering:
        // new User({
        //     clearanceLevel: 1,
        //     username: "john_doe",
        //     email: "john.doe@example.com",
        //     password: "securepassword123",
        //     displayName: "John Doe",
        //     profileDescription: "Just a regular guy.",
        //     profileTags: ["developer", "gamer", "tech enthusiast", "traveler", "music lover"], // At least 5 tags
        //     stories: [
        //         { visibility: "public", contentType: "text", content: "My first story!" },
        //         { visibility: "private", contentType: "image", content: "Vacation photo" },
        //         { visibility: "archived", contentType: "video", content: "Old memories" },
        //         { visibility: "public", contentType: "text", content: "Another post!" },
        //         { visibility: "private", contentType: "encodedJSON", content: "Custom data" }
        //     ],
        //     ignoredRecommendations: ["12345", "67890", "54321", "98765", "24680"], // At least 5 ignored recommendations
        //     friends: [
        //         { uid: "friend1" },
        //         { uid: "friend2" },
        //         { uid: "friend3" },
        //         { uid: "friend4" },
        //         { uid: "friend5" }
        //     ],
        //     lastLocation: "Berlin, Germany",
        //     profilePictureUrl: "https://example.com/profile.jpg",
        //     notifications: [
        //         { type: "friendRequest", pending: true, content: "User123 sent you a friend request." },
        //         { type: "friendRequestResponse", pending: false, content: "User456 accepted your request." },
        //         { type: "friendRequest", pending: true, content: "User789 wants to be your friend." },
        //         { type: "friendRequestResponse", pending: false, content: "User321 accepted your request." },
        //         { type: "friendRequest", pending: true, content: "User654 sent you a request." }
        //     ]
        // });
    
    try {
        const users = await User.find({});
        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}


module.exports = { getUser, getUsers };