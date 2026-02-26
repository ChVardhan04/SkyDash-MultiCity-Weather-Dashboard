const express = require('express');
const { getCities, addCity, removeCity, toggleFavorite, updateNotes } = require('../controllers/cityController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All city routes require auth

router.get('/', getCities);
router.post('/', addCity);
router.delete('/:id', removeCity);
router.patch('/:id/favorite', toggleFavorite);
router.patch('/:id/notes', updateNotes);

module.exports = router;
