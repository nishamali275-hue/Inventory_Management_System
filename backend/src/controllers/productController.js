const Product = require('../models/Product');
const Category = require('../models/Category');
const InventoryTransaction = require('../models/InventoryTransaction');
const QRCode = require('qrcode');
const { Parser } = require('json2csv');

/**
 * @desc    Get all products with filtering, search, sorting, and pagination
 * @route   GET /api/products
 * @access  Private
 */
exports.getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Search by product name, SKU, or supplier
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { sku: searchRegex },
        { supplierName: searchRegex }
      ];
    }

    // Filter by Category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by Stock Status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Pagination numbers
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Sort order
    const sortField = ['name', 'sku', 'quantity', 'unitPrice', 'createdAt', 'status'].includes(sortBy)
      ? sortBy
      : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortOptions = { [sortField]: sortDirection };

    // Execute query and total count in parallel
    const [total, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .populate('category', 'name description')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      total,
      totalPages,
      currentPage: pageNum,
      limit: limitNum,
      products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Private
 */
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name description');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new product
 * @route   POST /api/products
 * @access  Private (Admin only)
 */
exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      category,
      description,
      quantity,
      unitPrice,
      supplierName,
      lowStockThreshold,
      imageUrl
    } = req.body;

    // Validation
    if (!name || !sku || !category || quantity === undefined || unitPrice === undefined || !supplierName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, sku, category, quantity, unitPrice, supplierName'
      });
    }

    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(unitPrice);
    const parsedThreshold = lowStockThreshold ? Number(lowStockThreshold) : 10;

    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a valid non-negative number'
      });
    }

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Unit price must be a valid non-negative number'
      });
    }

    // Check unique SKU
    const existingSku = await Product.findOne({ sku: sku.trim().toUpperCase() });
    if (existingSku) {
      return res.status(409).json({
        success: false,
        message: `Product with SKU '${sku.trim().toUpperCase()}' already exists`
      });
    }

    // Verify category exists
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(404).json({
        success: false,
        message: `Category not found with id ${category}`
      });
    }

    // Handle image path if uploaded via multer
    let finalImageUrl = imageUrl || '';
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    }

    const product = await Product.create({
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      category,
      description: description ? description.trim() : '',
      quantity: parsedQuantity,
      unitPrice: parsedPrice,
      supplierName: supplierName.trim(),
      lowStockThreshold: parsedThreshold,
      imageUrl: finalImageUrl
    });

    // Record initial stock transaction
    if (parsedQuantity > 0) {
      await InventoryTransaction.create({
        product: product._id,
        type: 'IN',
        quantity: parsedQuantity,
        previousQuantity: 0,
        newQuantity: parsedQuantity,
        reason: 'Initial inventory entry',
        performedBy: req.user._id
      });
    }

    const populatedProduct = await Product.findById(product._id).populate('category', 'name description');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: populatedProduct
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private (Admin only)
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      category,
      description,
      quantity,
      unitPrice,
      supplierName,
      lowStockThreshold,
      imageUrl
    } = req.body;

    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id of ${req.params.id}`
      });
    }

    // Check SKU uniqueness if changed
    if (sku && sku.trim().toUpperCase() !== product.sku) {
      const existingSku = await Product.findOne({
        sku: sku.trim().toUpperCase(),
        _id: { $ne: product._id }
      });
      if (existingSku) {
        return res.status(409).json({
          success: false,
          message: `Another product with SKU '${sku.trim().toUpperCase()}' already exists`
        });
      }
      product.sku = sku.trim().toUpperCase();
    }

    // Check category if changed
    if (category && category !== product.category.toString()) {
      const categoryDoc = await Category.findById(category);
      if (!categoryDoc) {
        return res.status(404).json({
          success: false,
          message: `Category not found with id ${category}`
        });
      }
      product.category = category;
    }

    if (name) product.name = name.trim();
    if (description !== undefined) product.description = description.trim();
    if (supplierName) product.supplierName = supplierName.trim();
    if (lowStockThreshold !== undefined) product.lowStockThreshold = Number(lowStockThreshold);

    if (unitPrice !== undefined) {
      const parsedPrice = Number(unitPrice);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Unit price cannot be negative'
        });
      }
      product.unitPrice = parsedPrice;
    }

    // Track quantity adjustment if modified directly
    if (quantity !== undefined) {
      const parsedQuantity = Number(quantity);
      if (isNaN(parsedQuantity) || parsedQuantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity cannot be negative'
        });
      }

      if (parsedQuantity !== product.quantity) {
        const prevQty = product.quantity;
        const diff = parsedQuantity - prevQty;
        product.quantity = parsedQuantity;

        await InventoryTransaction.create({
          product: product._id,
          type: 'ADJUSTMENT',
          quantity: Math.abs(diff),
          previousQuantity: prevQty,
          newQuantity: parsedQuantity,
          reason: 'Manual adjustment during product update',
          performedBy: req.user._id
        });
      }
    }

    if (req.file) {
      product.imageUrl = `/uploads/${req.file.filename}`;
    } else if (imageUrl !== undefined) {
      product.imageUrl = imageUrl;
    }

    await product.save();

    const populatedProduct = await Product.findById(product._id).populate('category', 'name description');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: populatedProduct
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private (Admin only)
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id of ${req.params.id}`
      });
    }

    // Remove product and clean up transaction records
    await InventoryTransaction.deleteMany({ product: product._id });
    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: `Product '${product.name}' (SKU: ${product.sku}) deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate QR Code for product
 * @route   GET /api/products/:id/qrcode
 * @access  Private
 */
exports.getProductQrCode = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id of ${req.params.id}`
      });
    }

    const payload = JSON.stringify({
      id: product._id,
      name: product.name,
      sku: product.sku,
      category: product.category?.name || 'Uncategorized',
      price: product.unitPrice,
      quantity: product.quantity,
      status: product.status,
      supplier: product.supplierName
    });

    const qrCodeDataUrl = await QRCode.toDataURL(payload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      }
    });

    res.status(200).json({
      success: true,
      sku: product.sku,
      productName: product.name,
      qrCode: qrCodeDataUrl
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export inventory to CSV
 * @route   GET /api/products/export/csv
 * @access  Private
 */
exports.exportProductsCsv = async (req, res, next) => {
  try {
    const products = await Product.find().populate('category', 'name').sort({ name: 1 });

    const fields = [
      { label: 'Product Name', value: 'name' },
      { label: 'SKU', value: 'sku' },
      { label: 'Category', value: (row) => row.category?.name || 'Uncategorized' },
      { label: 'Quantity', value: 'quantity' },
      { label: 'Unit Price ($)', value: 'unitPrice' },
      { label: 'Total Value ($)', value: (row) => (row.quantity * row.unitPrice).toFixed(2) },
      { label: 'Supplier', value: 'supplierName' },
      { label: 'Status', value: 'status' },
      { label: 'Description', value: 'description' },
      { label: 'Date Added', value: (row) => new Date(row.createdAt).toLocaleDateString() }
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(products);

    res.header('Content-Type', 'text/csv');
    res.attachment(`inventory-export-${new Date().toISOString().slice(0, 10)}.csv`);
    return res.send(csv);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Import inventory from CSV file or raw content
 * @route   POST /api/products/import/csv
 * @access  Private (Admin only)
 */
exports.importProductsCsv = async (req, res, next) => {
  try {
    let csvContent = '';

    if (req.file && req.file.buffer) {
      csvContent = req.file.buffer.toString('utf-8');
    } else if (req.body && req.body.csv) {
      csvContent = req.body.csv;
    } else {
      return res.status(400).json({
        success: false,
        message: 'No CSV file or CSV text content provided'
      });
    }

    const lines = csvContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length <= 1) {
      return res.status(400).json({
        success: false,
        message: 'CSV file contains no data rows'
      });
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
    const nameIdx = headers.findIndex((h) => h.includes('name'));
    const skuIdx = headers.findIndex((h) => h.includes('sku'));
    const catIdx = headers.findIndex((h) => h.includes('cat'));
    const qtyIdx = headers.findIndex((h) => h.includes('quant') || h.includes('qty'));
    const priceIdx = headers.findIndex((h) => h.includes('price'));
    const suppIdx = headers.findIndex((h) => h.includes('supp'));
    const descIdx = headers.findIndex((h) => h.includes('desc'));

    if (nameIdx === -1 || skuIdx === -1) {
      return res.status(400).json({
        success: false,
        message: 'CSV must contain at least "Product Name" and "SKU" columns'
      });
    }

    let importedCount = 0;
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      const name = cols[nameIdx];
      const sku = (cols[skuIdx] || '').toUpperCase();
      const catName = catIdx !== -1 ? cols[catIdx] : 'General';
      const quantity = qtyIdx !== -1 ? parseInt(cols[qtyIdx], 10) || 0 : 0;
      const unitPrice = priceIdx !== -1 ? parseFloat(cols[priceIdx]) || 0 : 0;
      const supplierName = suppIdx !== -1 && cols[suppIdx] ? cols[suppIdx] : 'Default Supplier';
      const description = descIdx !== -1 ? cols[descIdx] : '';

      if (!name || !sku) {
        errors.push(`Row ${i}: Skipped due to missing Name or SKU`);
        continue;
      }

      try {
        // Resolve or create category
        let categoryDoc = await Category.findOne({ name: { $regex: new RegExp(`^${catName}$`, 'i') } });
        if (!categoryDoc) {
          categoryDoc = await Category.create({ name: catName, description: 'Imported category' });
        }

        const existing = await Product.findOne({ sku });
        if (existing) {
          existing.name = name;
          existing.category = categoryDoc._id;
          existing.quantity = quantity;
          existing.unitPrice = unitPrice;
          existing.supplierName = supplierName;
          if (description) existing.description = description;
          await existing.save();
        } else {
          const newProd = await Product.create({
            name,
            sku,
            category: categoryDoc._id,
            quantity,
            unitPrice,
            supplierName,
            description
          });

          if (quantity > 0) {
            await InventoryTransaction.create({
              product: newProd._id,
              type: 'IN',
              quantity,
              previousQuantity: 0,
              newQuantity: quantity,
              reason: 'Imported from CSV',
              performedBy: req.user._id
            });
          }
        }
        importedCount++;
      } catch (err) {
        errors.push(`Row ${i} (${sku}): ${err.message}`);
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully processed ${importedCount} items`,
      importedCount,
      errors
    });
  } catch (error) {
    next(error);
  }
};
