const { s3, bucketName } = require('../config/s3');
const fs = require('fs');
const path = require('path');

// 이미지 업로드 함수
async function uploadImage(file) {
  const fileContent = fs.readFileSync(file.path);
  const params = {
    Bucket: bucketName,
    Key: `images/${path.basename(file.path)}`,
    Body: fileContent,
    ContentType: file.mimetype,
  };

  try {
    const data = await s3.upload(params).promise();
    return data.Location;
  } catch (err) {
    console.error('Error uploading image to S3:', err);
    throw err;
  }
}

// 이미지 조회 함수
async function getImage(key) {
  const params = {
    Bucket: bucketName,
    Key: key,
  };

  try {
    const data = await s3.getObject(params).promise();
    return data.Body;
  } catch (err) {
    console.error('Error getting image from S3:', err);
    throw err;
  }
}

// 이미지 삭제 함수
async function deleteImage(key) {
  const params = {
    Bucket: bucketName,
    Key: key,
  };

  try {
    await s3.deleteObject(params).promise();
    console.log(`Image ${key} deleted successfully`);
  } catch (err) {
    console.error('Error deleting image from S3:', err);
    throw err;
  }
}

// 이미지 목록 조회 함수
async function listImages() {
  const params = {
    Bucket: bucketName,
    Prefix: 'images/',
  };

  try {
    const data = await s3.listObjectsV2(params).promise();
    return data.Contents.map(item => item.Key);
  } catch (err) {
    console.error('Error listing images from S3:', err);
    throw err;
  }
}

module.exports = {
  uploadImage,
  getImage,
  deleteImage,
  listImages,
};