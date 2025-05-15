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

        if (username === req.user.username) {
            return res.status(400).json({
                success: false,
                error: "You cannot send a friend request to yourself"
            })
        }

        const foundUser = await User.findOne({ username });
        if (!foundUser) {
            return res.status(404).json({ success: false, error: "User not found" });
        }
        const foundUserId = foundUser._id;

       if(req.user.friends.includes(foundUserId)) {
            return res.status(404).json({
                success: false,
                error: "You are already friends with this user"
            })
        }

       const existingRequest = await FriendRequest.findOne({
            sender: req.user._id,
            receiver: foundUserId
        });

        if (existingRequest) {
            return res.status(404).json({
                success: false,
                error: "Friend request already sent"
            });
        } 
    
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
                error: 'Username and valid status ("accepted" or "rejected") are required'
            });
        }

        const sender = await User.findOne({ username });
        if (!sender) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Find all pending friend requests from sender to receiver
        const requests = await FriendRequest.find({
            sender: sender._id,
            receiver: req.user._id,
            pending: true
        }).sort({ createdAt: 1 });  // oldest first, optional but recommended

        if (!requests || requests.length === 0) {
            return res.status(404).json({ success: false, error: 'Friend request not found' });
        }

        // Keep only the first one
        const [primaryRequest, ...duplicates] = requests;

        // Delete duplicates from DB
        if (duplicates.length > 0) {
            const duplicateIds = duplicates.map(r => r._id);
            await FriendRequest.deleteMany({ _id: { $in: duplicateIds } });
        }

        // Update the selected request
        primaryRequest.pending = false;
        primaryRequest.result = status;
        await primaryRequest.save();

        // If accepted, add each other as friends
        if (status === 'accepted') {
            if (!sender.friends.includes(req.user._id)) {
                sender.friends.push(req.user._id);
            }
            if (!req.user.friends.includes(sender._id)) {
                req.user.friends.push(sender._id);
            }
            await sender.save();
            await req.user.save();
        }

        await newNotification(
            {
                type: 'friendRequestResponse',
                content: JSON.stringify({
                    from: req.user._id,
                    result: status,
                    requestId: primaryRequest._id
                }),
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