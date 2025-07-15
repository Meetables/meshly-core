const { S3Client } = require('@aws-sdk/client-s3');

const ENV_VARS = require('../config/env-vars.js').ENV_VARS;

const fileClient = new S3Client({
    region: "us-east-1",
    endpoint: ENV_VARS.FILEBACKEND_URL,
    credentials: {
        accessKeyId: ENV_VARS.FILEBACKEND_ACCESS_KEY,
        secretAccessKey: ENV_VARS.FILEBACKEND_SECRET_KEY,
    },
    forcePathStyle: true
});


module.exports = {fileClient, fileBucket: ENV_VARS.FILEBACKEND_BUCKET};

