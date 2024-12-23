require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { uploadImage } = require('../utils/s3Utils');

const imageDirectory = path.join(__dirname, '..', 'public', 'images');
const outputFile = path.join(__dirname, 'imageUrlMapping.json');

async function migrateImages() {
  const imageUrlMapping = {};

  try {
    const files = fs.readdirSync(imageDirectory);

    for (const file of files) {
      if (file.match(/\.(jpg|jpeg|png|gif)$/)) {
        const filePath = path.join(imageDirectory, file);
        const s3Url = await uploadImage({ path: filePath, mimetype: getMimeType(file) });
        imageUrlMapping[file] = s3Url;
        console.log(`Uploaded ${file} to ${s3Url}`);
      }
    }

    fs.writeFileSync(outputFile, JSON.stringify(imageUrlMapping, null, 2));
    console.log(`Image URL mapping saved to ${outputFile}`);
  } catch (err) {
    console.error('Error migrating images:', err);
  }
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}

migrateImages();