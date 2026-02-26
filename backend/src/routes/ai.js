const express = require('express');
const { chat, getCityInsight } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/chat', chat);
router.post('/insight/:cityId', getCityInsight);

module.exports = router;
