const mongoose = require('mongoose');
const axios = require('axios');
const FriendRequest = require('../models/friendRequest.models');
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

// Store only the jwt-meshlycore cookie value
const storedTokens = {
  testuser3: null,
  testuser4: null
};

/**
 * Create an axios client configured to send the jwt cookie in headers
 */
function createClient(username, email, password, useStored = false) {
  const client = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' }
  });

  // Attach interceptor to include JWT cookie header
  client.interceptors.request.use(config => {
    const token = storedTokens[username];
    if (token) {
      config.headers['Cookie'] = `jwt-meshlycore=${token}`;
    }
    return config;
  });

  // If not reusing stored token, signup to get a fresh JWT
  if (!useStored) {
    return client.post('/auth/signup', { username, email, password })
      .then(response => {
        const setCookieHeaders = response.headers['set-cookie'] || [];
        // Extract only jwt-meshlycore cookie
        const jwtCookie = setCookieHeaders
          .map(c => c.split(';')[0])
          .find(c => c.startsWith('jwt-meshlycore='));
        if (jwtCookie) {
          storedTokens[username] = jwtCookie.split('=')[1];
          console.log(`Stored JWT for ${username}: ${storedTokens[username]}`);
        } else {
          console.warn(`jwt-meshlycore cookie not found for ${username}`);
        }
        return client;
      });
  }

  // If using stored token, return client directly
  return Promise.resolve(client);
}

async function main() {
  try {
    // 1) Connect & delete existing users
    await mongoose.connect('mongodb://localhost:27017/meshly-core', { useNewUrlParser: true });
    await User.deleteMany({ username: { $in: ['testuser3', 'testuser4'] } });
    await FriendRequest.deleteMany({ sender: { $in: ['testuser3', 'testuser4'] } });
    console.log('Deleted any old testuser3/testuser4');

    // 2) Signup or reuse tokens
    const pw = 'password123';
    console.log('Signing up testuser3…');
    const client3 = await createClient('testuser3', 'testuser3@example.com', pw, false);
    console.log('Signing up testuser4…');
    const client4 = await createClient('testuser4', 'testuser4@example.com', pw, false);

    // 3) Onboarding both users
    console.log('Onboarding testuser3…');
    await client3.post('/profile/onboarding', {
      displayName: 'testuser3',
      profileTagIds: TAGS,
      profileDescription: 'just a bot'
    });
    console.log('Onboarding testuser4…');
    await client4.post('/profile/onboarding', {
      displayName: 'testuser4',
      profileTagIds: TAGS,
      profileDescription: 'just a bot'
    });

    // 4) Set availability
    console.log('Setting availability for testuser3 & testuser4…');
    await client3.post('/extensions/set-availability', AVAIL);
    await client4.post('/extensions/set-availability', AVAIL);

    // 5) Trigger meeting lookup as testuser3
    console.log('Triggering meeting lookup as testuser3…');
    const meetRes = await client3.post('/extensions/meeting-lookup', {
        lastLocation: "48.12872785130619, 11.591843401497954"
    });
    console.log('Meeting lookup response:', meetRes.data);

    // 6) Fetch notifications for both
    console.log('Fetching notifications for testuser3…');
    const notes3 = (await client3.get('/profile/notifications')).data;
    console.log('testuser3 notifications:', notes3);
    console.log('Fetching notifications for testuser4…');
    const notes4 = (await client4.get('/profile/notifications')).data;
    console.log('testuser4 notifications:', notes4);

    // Clean up
    await mongoose.disconnect();
  } catch (err) {
    console.error(err.response?.data || err.message || err);
    process.exit(1);
  }
}

main();
