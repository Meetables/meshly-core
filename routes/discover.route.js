const express = require('express');

//import verifyAuth middleware and discover functions from disciver controllers

const { getTags, getFriendRecommendations, getPublicProfileData, getProfilePicture, userLookup } = require('../controllers/discover.controller');
const { verifyAuth } = require('../middleware/verifyAuth.middleware');

//Create router
const router = express.Router();

//endpoints
router.get('/search', verifyAuth, userLookup)

router.get('/tags', verifyAuth, getTags);

router.get('/profile', verifyAuth, getPublicProfileData);

router.get('/user-suggestions', verifyAuth, getFriendRecommendations);

router.get('/profile-picture', verifyAuth, getProfilePicture);

//export router
module.exports = router;