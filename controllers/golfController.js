const Golf = require('../models/golf');

exports.getGolfDetails = async (req, res) => {
  try {
    const golfId = req.params.id;
    const golf = await Golf.findById(golfId);

    if (!golf) {
      return res.status(404).send('Golf course not found');
    }

    res.render('golfDetails', { golf });
  } catch (error) {
    console.error('Error fetching golf details:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.listGolfCourses = async (req, res) => {
  try {
    const golfCourses = await Golf.find({});
    res.render('golfList', { golfCourses });
  } catch (error) {
    console.error('Error fetching golf courses:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.getAddGolfForm = (req, res) => {
  res.render('addGolf', { pageTitle: 'Add New Golf Course' });
};

exports.addGolf = async (req, res) => {
  try {
    const golfData = req.body;
    
    if (req.files) {
      if (req.files.image) {
        golfData.image_id = req.files.image[0].filename;
      }
      if (req.files.banner_image) {
        golfData.banner_image_id = req.files.banner_image[0].filename;
      }
      if (req.files.gallery) {
        golfData.gallery = req.files.gallery.map(file => file.filename);
      }
    }

    const newGolf = new Golf(golfData);
    await newGolf.save();
    res.redirect('/admin/golf-courses');
  } catch (error) {
    console.error('Error adding golf course:', error);
    res.status(500).send('Error adding golf course');
  }
};

exports.searchGolfCourses = async (req, res) => {
  try {
    const searchQuery = req.query.q || '';
    const golfCourses = await Golf.find({
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { location: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } }
      ]
    });

    res.render('partials/golfSearchResults', { golfCourses, searchQuery });
  } catch (error) {
    console.error('Error searching golf courses:', error);
    res.status(500).send('Internal Server Error');
  }
};


