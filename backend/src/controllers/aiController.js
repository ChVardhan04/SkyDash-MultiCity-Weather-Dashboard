const aiService = require('../services/aiService');
const weatherService = require('../services/weatherService');
const City = require('../models/City');

// POST /api/ai/chat - Main AI chat endpoint
const chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }
    if (message.length > 500) {
      return res.status(400).json({ error: 'Message too long (max 500 chars)' });
    }

    // Get user's cities with weather
    const cities = await City.find({ user: req.user._id });
    const { units = 'metric' } = req.query;

    const citiesWithWeather = await Promise.all(
      cities.map(async (city) => {
        try {
          const raw = await weatherService.getWeatherByCoords(city.lat, city.lon, units);
          return {
            name: city.name,
            country: city.country,
            isFavorite: city.isFavorite,
            weather: weatherService.formatWeatherData(raw, units),
          };
        } catch {
          return { name: city.name, country: city.country, isFavorite: city.isFavorite, weather: null };
        }
      })
    );

    const weatherContext = { cities: citiesWithWeather, units };
    const result = await aiService.runWeatherAgent(message.trim(), weatherContext);

    res.json({
      reply: result.message,
      meta: { iterations: result.iterations },
    });
  } catch (error) {
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'AI service rate limit reached. Please try again in a moment.' });
    }
    if (error.message?.includes('API key')) {
      return res.status(503).json({ error: 'AI service not configured. Please add an OpenAI API key.' });
    }
    next(error);
  }
};

// POST /api/ai/insight/:cityId - Generate insight for a single city
const getCityInsight = async (req, res, next) => {
  try {
    const city = await City.findOne({ _id: req.params.cityId, user: req.user._id });
    if (!city) return res.status(404).json({ error: 'City not found' });

    // Use cached insight if recent (< 1 hour)
    if (city.lastInsight?.text && city.lastInsight.generatedAt) {
      const age = Date.now() - new Date(city.lastInsight.generatedAt).getTime();
      if (age < 60 * 60 * 1000) {
        return res.json({ insight: city.lastInsight.text, cached: true });
      }
    }

    const raw = await weatherService.getWeatherByCoords(city.lat, city.lon);
    const weather = weatherService.formatWeatherData(raw);
    const insight = await aiService.generateCityInsight(city, weather);

    if (insight) {
      city.lastInsight = { text: insight, generatedAt: new Date() };
      await city.save();
    }

    res.json({ insight: insight || 'No insight available.', cached: false });
  } catch (error) {
    next(error);
  }
};

module.exports = { chat, getCityInsight };
