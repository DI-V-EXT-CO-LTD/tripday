const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');

router.get('/packageDetails/:id', packageController.getPackageDetails);

// Golf course list page (new route)
router.get('/list', packageController.listPackageCourses);

module.exports = router;