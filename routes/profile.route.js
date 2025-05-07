const express = require('express');

const verifyAuth = require('../middleware/verifyAuth.middleware');
const { onboardUser, ignoreSuggestedProfile, createNewStory } = require('../controllers/profile.controller');

const router = express.Router();

router.post('/onboarding', verifyAuth, onboardUser);

router.post('/ignore-profile', verifyAuth, ignoreSuggestedProfile);

router.post('/create-story', verifyAuth, createNewStory)

module.exports = router;