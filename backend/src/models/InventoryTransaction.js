const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required']
    },
    type: {
      type: String,
      enum: ['IN', 'OUT', 'ADJUSTMENT'],
      required: [true, 'Transaction type is required (IN, OUT, ADJUSTMENT)']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity changed is required'],
      min: [1, 'Quantity must be at least 1']
    },
    previousQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    newQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    reason: {
      type: String,
      trim: true,
      default: 'Manual stock update'
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User performing transaction is required']
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
