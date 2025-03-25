const express = require('express');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth.route.js')

const app = express();

const databaseUrl = process.env.DATABASE_URL;

mongoose.connect(databaseUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', (err) => {
  console.error(err);
});

db.once('open', () => {
  console.log('Connected to MongoDB');
});


app.get("/", (req, res) => {
    res.send("Server is running")
})

app.use("/api/v1/auth", authRoutes);


app.listen(3000, ()  => {
    console.log("Server started at port 3000")
})