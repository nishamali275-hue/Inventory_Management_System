const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    sku: {
      type: String,
      required: [true, 'Please provide a unique SKU'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [30, 'SKU cannot exceed 30 characters']
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please select a product category']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    quantity: {
      type: Number,
      required: [true, 'Please provide product quantity'],
      min: [0, 'Quantity cannot be negative'],
      default: 0
    },
    unitPrice: {
      type: Number,
      required: [true, 'Please provide a unit price'],
      min: [0, 'Unit price cannot be negative'],
      default: 0
    },
    supplierName: {
      type: String,
      required: [true, 'Please provide a supplier name'],
      trim: true,
      maxlength: [100, 'Supplier name cannot exceed 100 characters']
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [1, 'Low stock threshold must be at least 1']
    },
    status: {
      type: String,
      enum: ['In Stock', 'Low Stock', 'Out of Stock'],
      default: 'Out of Stock'
    },
    imageUrl: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Calculate status automatically based on quantity and threshold
productSchema.pre('save', function (next) {
  if (this.quantity === 0) {
    this.status = 'Out of Stock';
  } else if (this.quantity <= (this.lowStockThreshold || 10)) {
    this.status = 'Low Stock';
  } else {
    this.status = 'In Stock';
  }
  next();
});

// Text index for search on name and SKU
productSchema.index({ name: 'text', sku: 'text', supplierName: 'text' });

module.exports = mongoose.model('Product', productSchema);
