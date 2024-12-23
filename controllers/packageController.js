const Package = require('../models/package');

exports.getPackageDetails = async (req, res) => {
  try {
    const packageId = req.params.id;
    const package = await Package.findById(packageId);

    if (!package) {
      return res.status(404).send('package not found');
    }

    res.render('packageDetails', { package });
  } catch (error) {
    console.error('Error fetching package details:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.listPackageCourses = async (req, res) => {
  try {
    const packageList = await Package.find({});
    res.render('packageList', { packageList });
  } catch (error) {
    console.error('Error fetching packageList:', error);
    res.status(500).send('Internal Server Error');
  }
};



