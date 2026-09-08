const express = require('express');
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const cacheMiddleware = require('../middleware/cacheMiddleware');

const router = express.Router();

router.use(protect); // All category routes require authentication

router.route('/')
  .get(cacheMiddleware({ ttl: 300, prefix: 'categories:all' }), getCategories)
  .post(authorize('admin'), createCategory);

router.route('/:id')
  .get(cacheMiddleware({ ttl: 300, prefix: 'categories:item' }), getCategoryById)
  .put(authorize('admin'), updateCategory)
  .delete(authorize('admin'), deleteCategory);

module.exports = router;
