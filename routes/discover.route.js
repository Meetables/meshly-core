const express = require('express');

const verifyAuth = require('../middleware/verifyAuth.middleware');
const { getTags } = require('../controllers/discover.controller');

const router = express.Router();

router.get('/tags', verifyAuth, getTags);

module.exports = router;