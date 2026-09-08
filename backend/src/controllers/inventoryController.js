const Product = require('../models/Product');
const InventoryTransaction = require('../models/InventoryTransaction');
const { invalidateInventoryCache } = require('../utils/cacheInvalidator');

/**
 * @desc    Increase product stock (Stock In)
 * @route   POST /api/inventory/stock-in
 * @access  Private
 */
exports.stockIn = async (req, res, next) => {
  try {
    const { productId, quantity, reason } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide productId and quantity'
      });
    }

    const qtyNumber = parseInt(quantity, 10);
    if (isNaN(qtyNumber) || qtyNumber <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity to add must be a positive integer greater than 0'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id ${productId}`
      });
    }

    const previousQuantity = product.quantity;
    const newQuantity = previousQuantity + qtyNumber;

    product.quantity = newQuantity;
    await product.save();

    const transaction = await InventoryTransaction.create({
      product: product._id,
      type: 'IN',
      quantity: qtyNumber,
      previousQuantity,
      newQuantity,
      reason: reason ? reason.trim() : 'Stock replenishment',
      performedBy: req.user._id
    });

    const populatedTransaction = await InventoryTransaction.findById(transaction._id)
      .populate('product', 'name sku')
      .populate('performedBy', 'name email');

    await invalidateInventoryCache();

    res.status(200).json({
      success: true,
      message: `Successfully added ${qtyNumber} units to '${product.name}'. New stock: ${newQuantity}`,
      product,
      transaction: populatedTransaction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reduce product stock (Stock Out)
 * @route   POST /api/inventory/stock-out
 * @access  Private
 */
exports.stockOut = async (req, res, next) => {
  try {
    const { productId, quantity, reason } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide productId and quantity'
      });
    }

    const qtyNumber = parseInt(quantity, 10);
    if (isNaN(qtyNumber) || qtyNumber <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity to reduce must be a positive integer greater than 0'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id ${productId}`
      });
    }

    // CRITICAL: Prevent negative inventory values!
    if (product.quantity < qtyNumber) {
      return res.status(400).json({
        success: false,
        message: `Cannot reduce ${qtyNumber} units. Current stock is only ${product.quantity}. Negative inventory is prevented.`,
        currentStock: product.quantity,
        requestedReduction: qtyNumber
      });
    }

    const previousQuantity = product.quantity;
    const newQuantity = previousQuantity - qtyNumber;

    product.quantity = newQuantity;
    await product.save();

    const transaction = await InventoryTransaction.create({
      product: product._id,
      type: 'OUT',
      quantity: qtyNumber,
      previousQuantity,
      newQuantity,
      reason: reason ? reason.trim() : 'Stock dispatch/sales',
      performedBy: req.user._id
    });

    const populatedTransaction = await InventoryTransaction.findById(transaction._id)
      .populate('product', 'name sku')
      .populate('performedBy', 'name email');

    await invalidateInventoryCache();

    res.status(200).json({
      success: true,
      message: `Successfully dispatched ${qtyNumber} units of '${product.name}'. New stock: ${newQuantity}`,
      product,
      transaction: populatedTransaction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Manual stock adjustment
 * @route   POST /api/inventory/adjust
 * @access  Private (Admin only)
 */
exports.adjustStock = async (req, res, next) => {
  try {
    const { productId, targetQuantity, reason } = req.body;

    if (!productId || targetQuantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide productId and targetQuantity'
      });
    }

    const newQty = parseInt(targetQuantity, 10);
    if (isNaN(newQty) || newQty < 0) {
      return res.status(400).json({
        success: false,
        message: 'Target quantity must be a non-negative integer (0 or greater)'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id ${productId}`
      });
    }

    const previousQuantity = product.quantity;
    const diff = Math.abs(newQty - previousQuantity);

    if (diff === 0) {
      return res.status(200).json({
        success: true,
        message: 'Stock is already at target quantity. No adjustment needed.',
        product
      });
    }

    product.quantity = newQty;
    await product.save();

    const transaction = await InventoryTransaction.create({
      product: product._id,
      type: 'ADJUSTMENT',
      quantity: diff,
      previousQuantity,
      newQuantity: newQty,
      reason: reason ? reason.trim() : 'Physical audit adjustment',
      performedBy: req.user._id
    });

    const populatedTransaction = await InventoryTransaction.findById(transaction._id)
      .populate('product', 'name sku')
      .populate('performedBy', 'name email');

    await invalidateInventoryCache();

    res.status(200).json({
      success: true,
      message: `Stock for '${product.name}' adjusted from ${previousQuantity} to ${newQty}`,
      product,
      transaction: populatedTransaction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get audit trail / inventory transactions
 * @route   GET /api/inventory/transactions
 * @access  Private
 */
exports.getTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 15,
      productId,
      type
    } = req.query;

    const query = {};

    if (productId) {
      query.product = productId;
    }

    if (type && ['IN', 'OUT', 'ADJUSTMENT'].includes(type.toUpperCase())) {
      query.type = type.toUpperCase();
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const [total, transactions] = await Promise.all([
      InventoryTransaction.countDocuments(query),
      InventoryTransaction.find(query)
        .populate('product', 'name sku imageUrl')
        .populate('performedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      total,
      totalPages,
      currentPage: pageNum,
      transactions
    });
  } catch (error) {
    next(error);
  }
};
