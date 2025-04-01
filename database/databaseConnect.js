const mongoose = require('mongoose');
const { ENV_VARS } = require('../config/env-vars');


const connectToMongo = async () => {

    try {
        const databaseUrl = ENV_VARS.DATABASE_URL;
        console.log(databaseUrl)

        const connector = await mongoose.connect(databaseUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log("MongoDB connection opened with instance at " + connector.connection.host )
    } catch (error) {
        console.error("Error connecting to Mongo instance.")
        process.exit(1);
    }

}



const db = mongoose.connection;

db.on('error', (err) => {
    console.error(err);
});

db.once('open', () => {
    console.log('Connected to MongoDB');
});

module.exports = {db, connectToMongo}