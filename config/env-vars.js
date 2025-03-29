const dotenv = require('dotenv')

dotenv.config();

const ENV_VARS = {
    DATABASE_URL: process.env.DATABASE_URL,
    PORT: process.env.PORT || 3000
}

module.exports = {ENV_VARS}