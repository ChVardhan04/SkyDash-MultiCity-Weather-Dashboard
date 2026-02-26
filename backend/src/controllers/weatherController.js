const weatherService = require('../services/weatherService');

// GET /api/weather/current?lat=&lon=&units=
const getCurrentWeather = async (req, res, next) => {
  try {
    const { lat, lon, units = 'metric' } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'lat and lon are required' });

    const raw = await weatherService.getWeatherByCoords(parseFloat(lat), parseFloat(lon), units);
    const formatted = weatherService.formatWeatherData(raw, units);
    res.json({ weather: formatted });
  } catch (error) {
    next(error);
  }
};

// GET /api/weather/forecast?lat=&lon=&units=
const getForecast = async (req, res, next) => {
  try {
    const { lat, lon, units = 'metric' } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'lat and lon are required' });

    const raw = await weatherService.getForecastByCoords(parseFloat(lat), parseFloat(lon), units);
    const daily = weatherService.getDailyForecast(raw);
    res.json({ forecast: daily });
  } catch (error) {
    next(error);
  }
};

// GET /api/weather/search?q=city
const searchCities = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.status(400).json({ error: 'Query must be at least 2 characters' });

    // searchCities already returns formatted array for Nominatim
    const cities = await weatherService.searchCities(q.trim());
    res.json({ cities });
  } catch (error) {
    next(error);
  }
};

// GET /api/weather/bulk
const getBulkWeather = async (req, res, next) => {
  try {
    const City = require('../models/City');
    const cities = await City.find({ user: req.user._id });
    const { units = 'metric' } = req.query;

    const weatherPromises = cities.map(async (city) => {
      try {
        const raw = await weatherService.getWeatherByCoords(city.lat, city.lon, units);
        return { cityId: city._id, weather: weatherService.formatWeatherData(raw, units) };
      } catch {
        return { cityId: city._id, error: 'Failed to fetch weather' };
      }
    });

    const results = await Promise.all(weatherPromises);
    res.json({ results });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCurrentWeather, getForecast, searchCities, getBulkWeather };
