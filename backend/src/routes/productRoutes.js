const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductQrCode,
  exportProductsCsv,
  importProductsCsv
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { upload, csvUpload } = require('../middleware/uploadMiddleware');
const cacheMiddleware = require('../middleware/cacheMiddleware');

const router = express.Router();

router.use(protect); // All product routes require authentication

// CSV Export & Import (placed before /:id)
router.get('/export/csv', exportProductsCsv);
router.post('/import/csv', authorize('admin'), csvUpload.single('file'), importProductsCsv);

// Product CRUD
router.route('/')
  .get(cacheMiddleware({ ttl: 120, prefix: 'products:list' }), getProducts)
  .post(authorize('admin'), upload.single('image'), createProduct);

router.route('/:id')
  .get(cacheMiddleware({ ttl: 300, prefix: 'products:item' }), getProductById)
  .put(authorize('admin'), upload.single('image'), updateProduct)
  .delete(authorize('admin'), deleteProduct);

// QR Code route
router.get('/:id/qrcode', cacheMiddleware({ ttl: 600, prefix: 'products:qrcode' }), getProductQrCode);

module.exports = router;
