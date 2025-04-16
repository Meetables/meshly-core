const express = require('express');

const verifyAuth = require('../middleware/verifyAuth.middleware');
const { getTags, getFriendRecommendations } = require('../controllers/discover.controller');

const router = express.Router();

router.get('/tags', verifyAuth, getTags);

router.get('/user-suggestions', verifyAuth, getFriendRecommendations )
module.exports = router;