const express = require('express');

const authRoutes = require('./routes/auth.route.js');
const { ENV_VARS } = require('./config/env-vars.js');
const { connectToMongo } = require('./database/databaseConnect.js');

connectToMongo()

const app = express();

const _port = ENV_VARS.PORT;

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server is running")
})

app.use("/api/v1/auth", authRoutes);


app.listen(_port, ()  => {
    console.log("Server started at port " + _port)
})

