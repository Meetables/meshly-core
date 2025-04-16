const express = require('express');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth.route.js');
const profileRoutes = require('./routes/profile.route.js')
const discoverRoutes = require('./routes/discover.route.js')

const { ENV_VARS } = require('./config/env-vars.js');
const { connectToMongo } = require('./database/databaseConnect.js');
const initDb = require('./database/databaseInit.js');

connectToMongo().then(() => {
    initDb();
});

if (ENV_VARS.ENABLE_PROFILE_SUGGESTIONS && ENV_VARS.PROFILE_SUGGESTION_ALGORITHM_INTERVAL) {
    const profileMatchingAlgorithm = require('./services/suggest-profiles.service.js');

    profileMatchingAlgorithm();
    setInterval(profileMatchingAlgorithm, ENV_VARS.PROFILE_SUGGESTION_ALGORITHM_INTERVAL * 60 * 60 * 1000);
}


const app = express();

const _port = ENV_VARS.PORT;

app.use(express.json());

app.use(cookieParser());

app.get("/", (req, res) => {
    res.status(200).send("Server is running")
})

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/discover", discoverRoutes);

app.use("/api/v1/profile", profileRoutes);

app.listen(_port, () => {
    console.log("Server started at port " + _port)
})

