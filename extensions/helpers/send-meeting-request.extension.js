const User = require("../../models/user.models");
const FriendRequest = require("../../models/friendRequest.models"); // ensure filename matches
const { newNotification } = require("../../controllers/profile/notifications");

async function sendMeetingRequest(userId, targetUserId, isInstantMeet, lat, lon, datetime) {
  try {
    // Verify both users exist

    // In case it is not an instant meeting, we need to ensure lat, lon, and datetime are provided
    if (!isInstantMeet && (!lat || !lon || !datetime)) {
      return {
        success: false,
        error: "Meeting requests must contain a location and a time"
      }
    }

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

    // Check whether a request between those users already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: userId, receiver: targetUserId },
        { sender: targetUserId, receiver: userId }
      ]
    });

    if (existingRequest) {
      return {
        success: false,
        error: "A meeting request between these users already exists",
        isInstantMeet
      };
    }

    // Create a friend request (meeting request)
    const instantMeetId = crypto.randomUUID();
    const newRequest = new FriendRequest({
      sender: userId,
      receiver: targetUserId,
      pending: true,
      comment: isInstantMeet ? `Instant Meet request with id ${instantMeetId}` : `Meet request for location with lat ${lat} and lon ${lon} on ${datetime}`
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
