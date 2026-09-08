const express = require('express');
const {
  stockIn,
  stockOut,
  adjustStock,
  getTransactions
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect); // All inventory operations require authentication

router.post('/stock-in', stockIn);
router.post('/stock-out', stockOut);
router.post('/adjust', authorize('admin'), adjustStock);
router.get('/transactions', getTransactions);

module.exports = router;
