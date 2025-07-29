//extensions are only for a specific usecase for meshlycore which in our example is Meetables

const express = require('express');

//import veritfy auth middleware to 'protect' endpoints, so to require an authenticated user
const { verifyAuth } = require('../middleware/verifyAuth.middleware');

//import extensions
const { meetingLookup } = require('../extensions/instantMeeting/meetingLookup.extension');
const { setAvailability } = require('../extensions/availability/setAvailability.extension');
const { acceptInstantMeetRequest } = require('../extensions/instantMeeting/acceptInstantMeet.extensions');
const { getAvailability } = require('../extensions/availability/getAvailability');
const { respondToMeetRequest } = require('../extensions/respondToMeetRequest.extension');
const { meetingRequest, suggestMeetingContext } = require('../extensions/meetRequest.extension');
const { getNearbyInstantMeetings } = require('../extensions/instantMeeting/getNearbyInstantMeetings');
const { endInstantMeeting } = require('../extensions/instantMeeting/endInstantMeet.extension');
const {rejectInstantMeetRequest} = require("../extensions/instantMeeting/rejectInstantMeet.extensions");

//Create router
const router = express.Router();
//endpoints: instant meeting
router.post('/meeting-lookup', verifyAuth, meetingLookup);

router.get('/get-instant-meeting-requests', verifyAuth, getNearbyInstantMeetings);

router.post('/accept-instant-meeting-request', verifyAuth, acceptInstantMeetRequest);

router.post('/reject-instant-meeting-request', verifyAuth, rejectInstantMeetRequest);

router.post('/end-instant-meeting', verifyAuth, endInstantMeeting);

//planned meeting endpoints

router.post('/suggest-meeting-context', verifyAuth, suggestMeetingContext);

router.post('/send-meeting-request', verifyAuth, meetingRequest);

router.post('/respond-to-meeting-request', verifyAuth, respondToMeetRequest);

//availability endpoints
router.post('/set-availability', verifyAuth, setAvailability);

router.get('/get-availability', verifyAuth, getAvailability);

//export router
module.exports = router;