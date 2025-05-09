const express = require('express');

const verifyAuth = require('../middleware/verifyAuth.middleware');
const { meetingLookup } = require('../extensions/meetingLookup.extension');
const { setAvailability } = require('../extensions/setAvailability.extension');

const router = express.Router();

router.get('/meeting-lookup', verifyAuth, meetingLookup);

router.post('/set-availability', verifyAuth, setAvailability);


module.exports = router;