const express = require('express');

const verifyAuth = require('../middleware/verifyAuth.middleware');

const router = express.Router();

router.get('/meeting-lookup', verifyAuth, );

module.exports = router;