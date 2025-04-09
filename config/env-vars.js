const dotenv = require('dotenv')

dotenv.config();

console.log("Default tags: " + process.env.DEFAULT_TAGS)

const ENV_VARS = {
    DATABASE_URL: process.env.DATABASE_URL,
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    TAG_CATEGORIES: process.env.TAG_CATEGORIES,
    DEFAULT_TAGS: JSON.parse(process.env.DEFAULT_TAGS)
}

if (process.env.NODE_ENV = 'development') {
    ENV_VARS.DEV_TESTUSER_EMAIL = process.env.DEV_TESTUSER_EMAIL;
    ENV_VARS.DEV_TESTUSER_USERNAME = process.env.DEV_TESTUSER_USERNAME;
    ENV_VARS.DEV_TESTUSER_PASSWORD = process.env.DEV_TESTUSER_PASSWORD;
}

module.exports = {ENV_VARS}