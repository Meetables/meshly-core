const User = require("../models/user.models");
const FriendRequest = require("../models/friendRequest.models"); // ensure filename matches
const { v4: uuidv4 } = require("uuid");

async function sendMeetingRequest(userId, targetUserId, isInstantMeet) {
  try {
    // Verify both users exist
    const [user, targetUser] = await Promise.all([
      User.findById(userId),
      User.findById(targetUserId)
    ]);

    if (!user || !targetUser) {
      return {
        success: false,
        error: "User(s) not found",
        isInstantMeet
      };
    }

    // Create a friend request (meeting request)
    const newRequest = new FriendRequest({
      sender: userId,
      receiver: targetUserId,
      pending: true,
      comment: isInstantMeet ? "Instant Meet request" : "Meet request"
    });

    await newRequest.save();

    // Optionally notify the target user here (not shown)

    return {
      success: true,
      requestId: newRequest._id,
      isInstantMeet
    };
  } catch (error) {
    console.error("sendMeetingRequest error:", error);
    return {
      success: false,
      error: error.message || error,
      isInstantMeet
    };
  }
}

module.exports = {
  sendMeetingRequest
};
