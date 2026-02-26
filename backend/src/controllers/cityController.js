const City = require('../models/City');
const weatherService = require('../services/weatherService');

// GET /api/cities - Get all cities for the logged-in user
const getCities = async (req, res, next) => {
  try {
    const cities = await City.find({ user: req.user._id }).sort({ isFavorite: -1, displayOrder: 1, createdAt: 1 });
    res.json({ cities });
  } catch (error) {
    next(error);
  }
};

// POST /api/cities - Add a city
const addCity = async (req, res, next) => {
  try {
    const { name, country, countryCode, lat, lon } = req.body;

    if (!name || lat === undefined || lon === undefined) {
      return res.status(400).json({ error: 'City name, lat, and lon are required.' });
    }

    // Check city limit per user (max 20)
    const count = await City.countDocuments({ user: req.user._id });
    if (count >= 20) {
      return res.status(400).json({ error: 'Maximum 20 cities allowed per user.' });
    }

    const city = await City.create({
      user: req.user._id,
      name,
      country,
      countryCode,
      lat,
      lon,
      displayOrder: count,
    });

    res.status(201).json({ message: 'City added successfully', city });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'This city is already in your dashboard.' });
    }
    next(error);
  }
};

// DELETE /api/cities/:id - Remove a city
const removeCity = async (req, res, next) => {
  try {
    const city = await City.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!city) {
      return res.status(404).json({ error: 'City not found.' });
    }
    res.json({ message: 'City removed successfully' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/cities/:id/favorite - Toggle favorite
const toggleFavorite = async (req, res, next) => {
  try {
    const city = await City.findOne({ _id: req.params.id, user: req.user._id });
    if (!city) {
      return res.status(404).json({ error: 'City not found.' });
    }

    city.isFavorite = !city.isFavorite;
    await city.save();

    res.json({ message: `${city.isFavorite ? 'Added to' : 'Removed from'} favorites`, city });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/cities/:id/notes - Update city notes
const updateNotes = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const city = await City.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { notes },
      { new: true }
    );
    if (!city) return res.status(404).json({ error: 'City not found.' });
    res.json({ city });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCities, addCity, removeCity, toggleFavorite, updateNotes };
