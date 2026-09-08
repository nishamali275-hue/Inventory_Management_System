const express = require('express');
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const cacheMiddleware = require('../middleware/cacheMiddleware');

const router = express.Router();

router.use(protect);

router.get('/stats', cacheMiddleware({ ttl: 60, prefix: 'dashboard' }), getDashboardStats);

module.exports = router;
