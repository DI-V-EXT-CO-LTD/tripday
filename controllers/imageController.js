const { uploadImage, getImage, deleteImage, listImages } = require('../utils/s3Utils');

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const imageUrl = await uploadImage(req.file);
    res.json({ imageUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Error uploading image' });
  }
};

exports.getImage = async (req, res) => {
  try {
    const imageKey = req.params.key;
    const imageData = await getImage(imageKey);
    res.set('Content-Type', 'image/jpeg'); // Adjust content type as needed
    res.send(imageData);
  } catch (error) {
    console.error('Error getting image:', error);
    res.status(500).json({ message: 'Error getting image' });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const imageKey = req.params.key;
    await deleteImage(imageKey);
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Error deleting image' });
  }
};

exports.listImages = async (req, res) => {
  try {
    const images = await listImages();
    res.json(images);
  } catch (error) {
    console.error('Error listing images:', error);
    res.status(500).json({ message: 'Error listing images' });
  }
};