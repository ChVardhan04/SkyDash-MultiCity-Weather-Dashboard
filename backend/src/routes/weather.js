const express = require('express');
const { getCurrentWeather, getForecast, searchCities, getBulkWeather } = require('../controllers/weatherController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/search', protect, searchCities);
router.get('/current', protect, getCurrentWeather);
router.get('/forecast', protect, getForecast);
router.get('/bulk', protect, getBulkWeather);

module.exports = router;
