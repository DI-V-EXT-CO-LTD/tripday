// routes/golfRoutes.js
const express = require('express');
const router = express.Router();
const golfController = require('../controllers/golfController');

// Golf course search
router.get('/search', golfController.searchGolfCourses);

// Golf course list page (new route)
router.get('/courses', golfController.listGolfCourses);

// Golf course list page (old route, keep for compatibility)
router.get('/golf-courses', golfController.listGolfCourses);

// Golf course details page
router.get('/golf-courses/:id', golfController.getGolfDetails);

// Add new golf course form
router.get('/admin/add-golf', golfController.getAddGolfForm);

// Add new golf course process
router.post('/admin/add-golf', golfController.addGolf);

module.exports = router;