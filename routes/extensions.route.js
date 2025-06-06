//extensions are only for a specific usecase for meshlycore which in our example is Meetables

const express = require('express');

//import veritfy auth middleware to 'protect' endpoints, so to require an authenticated user
const verifyAuth = require('../middleware/verifyAuth.middleware');

//import extensions
const { meetingLookup } = require('../extensions/meetingLookup.extension');
const { setAvailability } = require('../extensions/availability/setAvailability.extension');
const { acceptInstantMeetRequest } = require('../extensions/acceptInstantMeet.extensions');
const { getAvailability } = require('../extensions/availability/getAvailability');

//Create router
const router = express.Router();

//endpoints
router.post('/meeting-lookup', verifyAuth, meetingLookup);

router.post('/set-availability', verifyAuth, setAvailability);

router.get('/get-availability', verifyAuth, getAvailability);

router.post('/accept-instant-meeting-request', verifyAuth, acceptInstantMeetRequest);

//export router
module.exports = router;