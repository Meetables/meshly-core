//this is the api's entrypoint

const express = require('express');
const cookieParser = require('cookie-parser');

//import routes, like "subdirectories for endpoints"
const authRoutes = require('./routes/auth.route.js');
const profileRoutes = require('./routes/profile.route.js')
const discoverRoutes = require('./routes/discover.route.js')
const extensionRoutes = require('./routes/extensions.route.js');
const adminRoutes = require('./routes/admin.route.js');

//other internal dependencies
const { ENV_VARS } = require('./config/env-vars.js');
const { connectToMongo } = require('./database/databaseConnect.js');
const initDb = require('./database/databaseInit.js');
const { runHealthcheck } = require('./services/healthcheck.service.js');

//initialize db connection
connectToMongo().then(() => {
    initDb();
});


//enable profile matching algorithm
console.log("running profile matching algorithm...");
if (ENV_VARS.ENABLE_PROFILE_SUGGESTIONS && ENV_VARS.PROFILE_SUGGESTION_ALGORITHM_INTERVAL) {
    const profileMatchingAlgorithm = require('./services/suggest-profiles.service.js');

    console.log("Starting profile matching algorithm...");
    profileMatchingAlgorithm()

    setInterval(() => {
        console.log("Starting profile matching algorithm...");
        profileMatchingAlgorithm()
    }, ENV_VARS.PROFILE_SUGGESTION_ALGORITHM_INTERVAL * 60 * 60 * 1000);
}

//create exporess app running on port ENV_VARS.PORT
const app = express();

const _port = ENV_VARS.PORT;

app.use(express.json());

//use cookieParser for jwt auth cookies
app.use(cookieParser());

app.get("/", (req, res) => {
    res.status(200).send("Server is running")
})


//use imported routes
app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/discover", discoverRoutes);

app.use("/api/v1/profile", profileRoutes);

app.use("/api/v1/extensions", extensionRoutes);

app.use("/api/v1/admin", adminRoutes);

//listen on port _port
app.listen(_port, () => {
    console.log("Server started at port " + _port)
})

//wait a minute first, then run healthcheck hourly
setTimeout(() => {
    console.log("Running initial healthcheck...");

    runHealthcheck().then(result => {
        console.log(result.message + ' ' + (result.error ? (result.error + ' ❌') : '(✅)'));
    });

    setInterval(async () => {
        const result = await runHealthcheck();
        console.log(result.message + ' ' + (result.error ? (result.error + ' ❌') : '(✅)'));
    }, 60 * 60 * 1000);
}, 60 * 1000);

