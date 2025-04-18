const express = require('express');

const verifyAuth = require('../middleware/verifyAuth.middleware');
const { onboardUser } = require('../controllers/profile.controller');

const router = express.Router();

router.post('/onboarding', verifyAuth, onboardUser)

module.exports = router;