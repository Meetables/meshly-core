//extensions are only for a specific usecase for meshlycore which in our example is Meetables

const express = require('express');

//import veritfy auth middleware to 'protect' endpoints, so to require an authenticated user
const verifyAuth = require('../middleware/verifyAuth.middleware');

//import extensions
const { meetingLookup } = require('../extensions/instantMeeting/meetingLookup.extension');
const { setAvailability } = require('../extensions/availability/setAvailability.extension');
const { acceptInstantMeetRequest } = require('../extensions/instantMeeting/acceptInstantMeet.extensions');
const { getAvailability } = require('../extensions/availability/getAvailability');
const { respondToMeetRequest } = require('../extensions/respondToMeetRequest.extension');
const { meetingRequest, suggestMeetingContext } = require('../extensions/meetRequest.extension');

//Create router
const router = express.Router();

//endpoints
router.post('/meeting-lookup', verifyAuth, meetingLookup);

router.post('/set-availability', verifyAuth, setAvailability);

router.get('/get-availability', verifyAuth, getAvailability);

router.post('/accept-instant-meeting-request', verifyAuth, acceptInstantMeetRequest);

router.post('/suggest-meeting-context', verifyAuth, suggestMeetingContext);

router.post('/send-meeting-request', verifyAuth, meetingRequest);

router.post('/respond-to-meeting-request', verifyAuth, respondToMeetRequest);
//export router
module.exports = router;