const { HeadBucketCommand, CreateBucketCommand } = require("@aws-sdk/client-s3");
const { fileClient, fileBucket } = require("./connect");

async function ensureBucketExists() {
    try {
        await fileClient.send(new HeadBucketCommand({ Bucket: fileBucket }));
        console.log(`✅ Bucket "${fileBucket}" already exists.`);
    } catch (err) {
        if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
            console.log(`ℹ️ Bucket "${fileBucket}" not found. Creating...`);
            await fileClient.send(new CreateBucketCommand({ Bucket: fileBucket }));
            console.log(`✅ Bucket "${fileBucket}" created.`);
        } else {
            console.error("❌ Error checking/creating bucket:", err);
            throw err;
        }
    }
}

module.exports = { ensureBucketExists }