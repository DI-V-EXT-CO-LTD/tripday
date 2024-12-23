const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Temporary storage
const imageController = require('../controllers/imageController');

// Upload an image
router.post('/upload', upload.single('image'), imageController.uploadImage);

// Get an image
router.get('/:key', imageController.getImage);

// Delete an image
router.delete('/:key', imageController.deleteImage);

// List all images
router.get('/', imageController.listImages);

module.exports = router;