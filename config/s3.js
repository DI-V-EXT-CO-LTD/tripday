const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  endpoint: process.env.VULTR_S3_ENDPOINT,
  accessKeyId: process.env.VULTR_S3_ACCESS_KEY,
  secretAccessKey: process.env.VULTR_S3_SECRET_KEY,
  s3ForcePathStyle: true, // Vultr S3 requires this
});

const bucketName = process.env.VULTR_S3_BUCKET_NAME;

module.exports = { s3, bucketName };