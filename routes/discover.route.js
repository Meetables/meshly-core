const express = require('express');

const verifyAuth = require('../middleware/verifyAuth.middleware');
const { getTags, getFriendRecommendations, getPublicProfileData } = require('../controllers/discover.controller');

const router = express.Router();

router.get('/tags', verifyAuth, getTags);

router.get('/profile', verifyAuth, getPublicProfileData);

router.get('/user-suggestions', verifyAuth, getFriendRecommendations);

module.exports = router;