const express = require('express');

const verifyAuth = require('../middleware/verifyAuth.middleware');
const { onboardUser, ignoreSuggestedProfile, createNewStory, sendFriendRequest, getNotifications, respondToFriendRequest } = require('../controllers/profile.controller');

const router = express.Router();

router.post('/onboarding', verifyAuth, onboardUser);

router.post('/ignore-profile', verifyAuth, ignoreSuggestedProfile);

router.post('/create-story', verifyAuth, createNewStory);

router.post('/send-friend-request', verifyAuth, sendFriendRequest);

router.post('/respond-to-friend-request', verifyAuth, respondToFriendRequest);

router.get('/notifications', verifyAuth, getNotifications);

module.exports = router;