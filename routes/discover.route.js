const express = require('express');

//import verifyAuth middleware and discover functions from disciver controllers
const verifyAuth = require('../middleware/verifyAuth.middleware');
const { getTags, getFriendRecommendations, getPublicProfileData } = require('../controllers/discover.controller');

//Create router
const router = express.Router();

//endpoints
router.get('/tags', verifyAuth, getTags);

router.get('/profile', verifyAuth, getPublicProfileData);

router.get('/user-suggestions', verifyAuth, getFriendRecommendations);

//export router
module.exports = router;