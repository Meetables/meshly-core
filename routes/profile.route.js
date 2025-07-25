const express = require('express');

// Import verifyAuth middleware to authenticate user requests
const { verifyAuth } = require('../middleware/verifyAuth.middleware');
// Import profile controller functions to handle user profile operations
const { onboardUser, ignoreSuggestedProfile, createNewStory, sendFriendRequest, getNotifications, respondToFriendRequest, getFriendRequests, getPublicProfileData, uploadProfilePicture, updateProfileData } = require('../controllers/profile/profile.controller');

const multer = require('multer');
const { filterUserDto } = require('../middleware/filterUserDto.middleware');

const upload = multer({ dest: 'uploads/' });

// Create a new router instance
const router = express.Router();

// Endpoint to retrieve the currently authenticated user's data
router.get('/me', verifyAuth, filterUserDto, (req, res) => {
    // Return the user's data with password removed
    res.status(200).json({
			success: true,
			user: req.user
		});
})

// Endpoint to retrieve a user's public profile data
router.get('/public-profile', verifyAuth, getPublicProfileData);

// Endpoint to onboard a new user
router.post('/onboarding', verifyAuth, onboardUser);

//Endpoint to update user profile data
router.post('/update-profile', verifyAuth, updateProfileData);

// Endpoint to ignore a suggested profile
router.post('/ignore-profile', verifyAuth, ignoreSuggestedProfile);

// Endpoint to create a new story
router.post('/create-story', verifyAuth, createNewStory);

// Endpoint to send a friend request to another user
router.post('/send-friend-request', verifyAuth, sendFriendRequest);

// Endpoint to respond to a friend request
router.post('/respond-to-friend-request', verifyAuth, respondToFriendRequest);

// Endpoint to retrieve a list of friend requests
router.get('/friend-requests', verifyAuth, getFriendRequests);

// Endpoint to retrieve a list of notifications
router.get('/notifications', verifyAuth, getNotifications);

//upload a profile picture
router.post('/upload-profile-pic', verifyAuth, upload.single('profilePicture'), uploadProfilePicture);



// Export the router instance
module.exports = router;
