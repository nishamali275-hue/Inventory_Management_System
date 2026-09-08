const Category = require('../models/Category');
const Product = require('../models/Product');
const { invalidateCategoryCache } = require('../utils/cacheInvalidator');

/**
 * @desc    Get all categories with product counts
 * @route   GET /api/categories
 * @access  Private
 */
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'category',
          as: 'products'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          createdAt: 1,
          updatedAt: 1,
          productsCount: { $size: '$products' }
        }
      },
      { $sort: { name: 1 } }
    ]);

    res.status(200).json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single category by ID
 * @route   GET /api/categories/:id
 * @access  Private
 */
exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category not found with id of ${req.params.id}`
      });
    }

    const productsCount = await Product.countDocuments({ category: category._id });

    res.status(200).json({
      success: true,
      category: {
        ...category.toObject(),
        productsCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new category
 * @route   POST /api/categories
 * @access  Private (Admin only)
 */
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: `Category with name '${name.trim()}' already exists`
      });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description ? description.trim() : ''
    });

    await invalidateCategoryCache();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: {
        ...category.toObject(),
        productsCount: 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 * @access  Private (Admin only)
 */
exports.updateCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category not found with id of ${req.params.id}`
      });
    }

    if (name && name.trim().toLowerCase() !== category.name.toLowerCase()) {
      const duplicate = await Category.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: category._id }
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Another category with name '${name.trim()}' already exists`
        });
      }
    }

    category.name = name !== undefined ? name.trim() : category.name;
    category.description = description !== undefined ? description.trim() : category.description;
    await category.save();

    const productsCount = await Product.countDocuments({ category: category._id });

    await invalidateCategoryCache();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category: {
        ...category.toObject(),
        productsCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete category
 * @route   DELETE /api/categories/:id
 * @access  Private (Admin only)
 */
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category not found with id of ${req.params.id}`
      });
    }

    // Safety check: Prevent deletion if products exist in this category
    const productsInCat = await Product.countDocuments({ category: category._id });
    if (productsInCat > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category '${category.name}' because it contains ${productsInCat} product(s). Reassign or delete these products first.`
      });
    }

    await category.deleteOne();

    await invalidateCategoryCache();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
