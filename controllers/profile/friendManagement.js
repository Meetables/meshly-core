const FriendRequest = require("../../models/friendRequest.models");
const User = require("../../models/user.models");
const { newNotification } = require("./notifications");


//friend request related functions

async function getFriendRequests(req, res) {
  try {
    const userId = req.user._id.toString();

    // Fetch all pending friend requests where user is either sender or receiver
    const friendRequests = await FriendRequest.find({
      $or: [{ sender: userId }, { receiver: userId }],
      pending: true
    });

    if (!friendRequests.length) {
      return res.status(200).json({
        success: false,
        error: "No friend requests found"
      });
    }

    // Get unique userIds involved in requests to resolve usernames
    const involvedUserIds = friendRequests.map(fr =>
      fr.sender === userId ? fr.receiver : fr.sender
    );

    const users = await User.find({ _id: { $in: involvedUserIds } });

    const idToUsername = users.reduce((acc, user) => {
      acc[user._id.toString()] = user.username;
      return acc;
    }, {});

    const formattedRequests = friendRequests.map(fr => {
      const isSender = fr.sender === userId;
      const involvedUserId = isSender ? fr.receiver : fr.sender;
      return {
        isSender,
        involvedUserUsername: idToUsername[involvedUserId],
        comment: fr.comment,
        timestamp: fr.timestamp,
        requestId: fr._id
      };
    });

    return res.status(200).json({
      success: true,
      friendRequests: formattedRequests
    });
  } catch (error) {
    console.error("getFriendRequests error:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function sendFriendRequest(req, res) {
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
        const foundUserId = foundUser._id;

    
        const newRequest = new FriendRequest({
            sender: req.user._id,
            receiver: foundUserId,
            pending: true,
            timestamp: Date.now()
        });

        await newRequest.save();

        await newNotification(
            {
                type: "friendRequest",
                content: JSON.stringify({ title: "New friend request from user with username " + foundUser.username, friendRequestId: newRequest._id }),
                pending: true,
                timestamp: Date.now()
            }, foundUserId
        )

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

async function respondToFriendRequest(req, res) {
    try {
        const { username, status } = req.body;
        if (!username || !['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Username and valid status ("accept" or "rejected") are required'
            });
        }

        // find the user who sent the request
        const sender = await User.findOne({ username });
        if (!sender) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // load the pending friend request
        const fr = await FriendRequest.findOne({
            sender: sender._id,
            receiver: req.user._id,
            pending: true
        });
        if (!fr) {
            return res.status(404).json({ success: false, error: 'Friend request not found' });
        }

        // update the request
        fr.pending = false;
        fr.result = status; // "accepted" or "declined"
        await fr.save();

        // if accepted, add each other as friends
        if (status === 'accept') {
            // avoid duplicates
            if (!sender.friends.includes(req.user._id)) {
                sender.friends.push(req.user._id);
            }
            if (!req.user.friends.includes(sender._id)) {
                req.user.friends.push(sender._id);
            }
            await sender.save();
            await req.user.save();
        }

        // notify the original sender
        await newNotification(
            {
                type: 'friendRequestResponse',
                content: {
                    from: req.user._id,
                    result: status,
                    requestId: fr._id
                },
                timestamp: Date.now()
            },
            sender._id
        );

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('respondToFriendRequest error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    getFriendRequests,
    sendFriendRequest,
    respondToFriendRequest
}