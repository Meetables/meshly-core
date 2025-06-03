const User = require("../models/user.models");
const FriendRequest = require("../models/friendRequest.models"); // ensure filename matches
const { newNotification } = require("../controllers/profile/notifications");

async function sendMeetingRequest(userId, targetUserId, isInstantMeet) {
  try {
    // Verify both users exist
    console.log("Sending meeting request from userId:", userId, "to targetUserId:", targetUserId);
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
    const instantMeetId = crypto.randomUUID();
    const newRequest = new FriendRequest({
      sender: userId,
      receiver: targetUserId,
      pending: true,
      comment: isInstantMeet ? `Instant Meet request with id ${instantMeetId}` : "Meet request"
    });

    await newRequest.save();

    newNotification(
      {
        type: isInstantMeet ? "instant_meet_request" : "meet_request",
        timestamp: Date.now(),
        content: JSON.stringify({
          isInstantMeet,
          meetingRequestId: newRequest._id
        }
        ),
        pending: true
      }, targetUserId
    );

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
