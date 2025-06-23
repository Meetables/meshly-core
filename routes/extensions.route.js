const express = require('express');

const { verifyAuth } = require('../middleware/verifyAuth.middleware');
const { meetingLookup } = require('../extensions/meetingLookup.extension');
const { setAvailability } = require('../extensions/setAvailability.extension');
const { acceptInstantMeetRequest } = require('../extensions/acceptInstantMeet.extensions');
const { getAvailability } = require('../extensions/getAvailability');



const router = express.Router();


router.post('/meeting-lookup', verifyAuth, meetingLookup);

router.post('/set-availability', verifyAuth, setAvailability);

router.get('/get-availability', verifyAuth, getAvailability);

router.post('/accept-instant-meeting-request', verifyAuth, acceptInstantMeetRequest);




module.exports = router;