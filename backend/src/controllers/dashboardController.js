const Product = require('../models/Product');
const Category = require('../models/Category');

/**
 * @desc    Get dashboard statistics and chart data
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalProducts,
      totalCategories,
      productsStats,
      categoryDistribution
    ] = await Promise.all([
      // 1. Total products count
      Product.countDocuments(),

      // 2. Total categories count
      Category.countDocuments(),

      // 3. Aggregate product metrics (Total Stock, Valuation, Status counts)
      Product.aggregate([
        {
          $group: {
            _id: null,
            totalStockQuantity: { $sum: '$quantity' },
            totalInventoryValue: {
              $sum: { $multiply: ['$quantity', '$unitPrice'] }
            },
            inStockCount: {
              $sum: { $cond: [{ $eq: ['$status', 'In Stock'] }, 1, 0] }
            },
            lowStockCount: {
              $sum: { $cond: [{ $eq: ['$status', 'Low Stock'] }, 1, 0] }
            },
            outOfStockCount: {
              $sum: { $cond: [{ $eq: ['$status', 'Out of Stock'] }, 1, 0] }
            }
          }
        }
      ]),

      // 4. Products and stock per category
      Product.aggregate([
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryDoc'
          }
        },
        { $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$category',
            categoryName: { $first: { $ifNull: ['$categoryDoc.name', 'Uncategorized'] } },
            productCount: { $sum: 1 },
            totalStock: { $sum: '$quantity' },
            categoryValue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } }
          }
        },
        { $sort: { totalStock: -1 } }
      ])
    ]);

    const stats = productsStats[0] || {
      totalStockQuantity: 0,
      totalInventoryValue: 0,
      inStockCount: 0,
      lowStockCount: 0,
      outOfStockCount: 0
    };

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalProducts,
          totalCategories,
          totalStockQuantity: stats.totalStockQuantity,
          totalInventoryValue: Number((stats.totalInventoryValue || 0).toFixed(2)),
          inStockCount: stats.inStockCount,
          lowStockCount: stats.lowStockCount,
          outOfStockCount: stats.outOfStockCount
        },
        stockStatusDistribution: [
          { status: 'In Stock', count: stats.inStockCount, color: '#10b981' },
          { status: 'Low Stock', count: stats.lowStockCount, color: '#f59e0b' },
          { status: 'Out of Stock', count: stats.outOfStockCount, color: '#ef4444' }
        ],
        categoryDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};
