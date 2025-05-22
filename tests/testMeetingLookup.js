const mongoose = require('mongoose');
const axios = require('axios');
const User = require('../models/user.models');

const API_BASE = 'http://localhost:3000/api/v1';
const TAGS = ['661bb62a97c7a8efc3a3b02d', '661bb80197c7a8efc3a3b032'];
const AVAIL = {
  mon: '01:00-23:50',
  tue: '01:00-23:50',
  wed: '01:00-23:50',
  thu: '01:00-23:50',
  fri: '01:00-23:50',
  sat: '01:00-23:50',
  sun: '01:00-23:50',
};

const storedTokens = {
  testuser3: null,
  testuser4: null
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createClient(username, email, password, useStored = false) {
  const client = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' }
  });

  client.interceptors.request.use(config => {
    const token = storedTokens[username];
    if (token) {
      config.headers['Cookie'] = `jwt-meshlycore=${token}`;
    }
    return config;
  });

  if (!useStored) {
    return client.post('/auth/signup', { username, email, password })
      .then(response => {
        const setCookie = response.headers['set-cookie'] || [];
        const jwtCookie = setCookie
          .map(c => c.split(';')[0])
          .find(c => c.startsWith('jwt-meshlycore='));
        if (jwtCookie) {
          storedTokens[username] = jwtCookie.split('=')[1];
        }
        return client;
      });
  }

  return Promise.resolve(client);
}

async function main() {
  try {
    // --- SETUP & CLEANUP ---
    await mongoose.connect('mongodb://localhost:27017/meshly-core', { useNewUrlParser: true });
    // clean out any old test users & friend-requests
    await mongoose.connection.collection('friendrequests').deleteMany({});
    await User.deleteMany({ username: { $in: ['testuser3', 'testuser4'] } });

    // --- SIGNUP & ONBOARD ---
    const pw = 'password123';
    const client3 = await createClient('testuser3', 'testuser3@example.com', pw, false);
    const client4 = await createClient('testuser4', 'testuser4@example.com', pw, false);

    await client3.post('/profile/onboarding', {
      displayName: 'testuser3',
      profileTagIds: TAGS,
      profileDescription: 'just a bot'
    });
    await client4.post('/profile/onboarding', {
      displayName: 'testuser4',
      profileTagIds: TAGS,
      profileDescription: 'just a bot'
    });

    // --- SET AVAILABILITY ---
    await client3.post('/extensions/set-availability', AVAIL);
    await client4.post('/extensions/set-availability', AVAIL);

    // --- TRIGGER MEETING LOOKUP AS TESTUSER3 ---
      console.log('Triggering meeting lookup as testuser3…');
  const meetRes = await client3.post('/extensions/meeting-lookup', {
        lastLocation: "48.12872785130619, 11.591843401497954"
    });
    console.log('Meeting lookup response:', meetRes.data);
    // --- FETCH NOTIFICATIONS FOR TESTUSER4 & EXTRACT REQUEST ID ---
    console.log('Fetching notifications for testuser4…');
    const notes4 = (await client4.get('/profile/notifications')).data;
    console.log('testuser4 notifications:', JSON.stringify(notes4, null, 2));

    const instantReqNote = notes4.notifications.find(n => n.type === 'instant_meet_request');
    if (!instantReqNote) throw new Error('No instant meeting request notification found');

    const content = JSON.parse(instantReqNote.content);
    const requestId = content.meetingRequestId;
    console.log('Extracted meetingRequestId:', requestId);

    // --- ACCEPT THE INSTANT MEETING REQUEST AS TESTUSER4 ---
    console.log(`Accepting meeting request ${requestId} as testuser4…`);
    const acceptRes = await client4.post('/extensions/accept-instant-meeting-request', {
      requestId,
      location: '48.1287,11.5918'
    });
    console.log('Accept response:', acceptRes.data);

    // --- VERIFY NOTIFICATIONS AFTER ACCEPT ---
    console.log('Fetching notifications for testuser3…');
    const notes3After = (await client3.get('/profile/notifications')).data;
    console.log('testuser3 notifications:', JSON.stringify(notes3After, null, 2));

    console.log('Fetching notifications for testuser4…');
    const notes4After = (await client4.get('/profile/notifications')).data;
    console.log('testuser4 notifications:', JSON.stringify(notes4After, null, 2));

  const start = Date.now();
  let lastCount = 0;

  // fetch initial count
  {
    const initial = (await client3.get('/profile/notifications')).data;
    lastCount = initial.notifications.length;
  }

  while (Date.now() - start < 60_000) {
    await sleep(5_000);  // wait 5 seconds between polls

    const notes3 = (await client3.get('/profile/notifications')).data;
    const count = notes3.notifications.length;

    if (count > lastCount) {
      console.log('Fetching notifications for testuser3…');
      console.log('testuser3 notifications:', JSON.stringify(notes3, null, 2));
      break;  // stop once we see new notifications
    }
  }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err.response?.data || err.message || err);
    process.exit(1);
  }
}

main();
