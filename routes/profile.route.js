const express = require('express');

const { verifyAuth } = require('../middleware/verifyAuth.middleware');
const { onboardUser, ignoreSuggestedProfile, createNewStory, sendFriendRequest, getNotifications, respondToFriendRequest, getFriendRequests, getPublicProfileData } = require('../controllers/profile/profile.controller');



const router = express.Router();


router.get('/me', verifyAuth, (req, res) => {
    res.status(200).json({
			success: true,
			user: {
				...req.user._doc,
				password: "",
			},
		});
})

router.get('/public-profile', verifyAuth, getPublicProfileData);

router.post('/onboarding', verifyAuth, onboardUser);

router.post('/ignore-profile', verifyAuth, ignoreSuggestedProfile);

router.post('/create-story', verifyAuth, createNewStory);

router.post('/send-friend-request', verifyAuth, sendFriendRequest);

router.post('/respond-to-friend-request', verifyAuth, respondToFriendRequest);

router.get('/friend-requests', verifyAuth, getFriendRequests);

router.get('/notifications', verifyAuth, getNotifications);

module.exports = router;