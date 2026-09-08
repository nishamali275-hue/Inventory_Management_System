require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const InventoryTransaction = require('../models/InventoryTransaction');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory_db';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB for seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      InventoryTransaction.deleteMany({})
    ]);
    console.log('[Seed] Cleared existing data.');

    // 1. Create Users
    const adminUser = await User.create({
      name: 'Admin Manager',
      email: 'admin@example.com',
      password: 'Admin@123',
      role: 'admin'
    });

    const standardUser = await User.create({
      name: 'Inventory Staff',
      email: 'user@example.com',
      password: 'User@123',
      role: 'user'
    });
    console.log('[Seed] Created default users:');
    console.log('   - Admin: admin@example.com / Admin@123');
    console.log('   - Staff: user@example.com / User@123');

    // 2. Create Categories
    const categoriesData = [
      { name: 'Electronics', description: 'Computing gear, screens, smart accessories, and peripherals' },
      { name: 'Office Supplies', description: 'Stationery, paper products, printer inks, and desk accessories' },
      { name: 'Furniture', description: 'Ergonomic seating, height-adjustable desks, and storage units' },
      { name: 'Industrial Tools', description: 'Power equipment, hand tools, safety gear, and precision meters' },
      { name: 'Packaging', description: 'Shipping boxes, bubble wrap rolls, tamper tapes, and envelopes' }
    ];

    const categories = await Category.insertMany(categoriesData);
    console.log(`[Seed] Created ${categories.length} categories.`);

    const catMap = {};
    categories.forEach((c) => {
      catMap[c.name] = c._id;
    });

    // 3. Create Sample Products
    const productsData = [
      {
        name: 'Dell UltraSharp 27" 4K Monitor',
        sku: 'ELEC-MON-001',
        category: catMap['Electronics'],
        description: 'IPS Black panel 4K UHD USB-C Hub Monitor with 98% DCI-P3 color coverage',
        quantity: 35,
        unitPrice: 549.99,
        supplierName: 'Dell Global Logistics',
        lowStockThreshold: 10
      },
      {
        name: 'Logitech MX Master 3S Wireless Mouse',
        sku: 'ELEC-MOU-002',
        category: catMap['Electronics'],
        description: 'Quiet clicks 8K DPI sensor electromagnetic scrolling ergonomic mouse',
        quantity: 8,
        unitPrice: 99.99,
        supplierName: 'Logitech Direct',
        lowStockThreshold: 10
      },
      {
        name: 'Apple MacBook Pro 14" M3',
        sku: 'ELEC-LAP-003',
        category: catMap['Electronics'],
        description: '18GB Unified Memory 512GB SSD Space Gray Liquid Retina XDR display',
        quantity: 0,
        unitPrice: 1999.00,
        supplierName: 'Apple Distribution EMEA',
        lowStockThreshold: 5
      },
      {
        name: 'Keychron K2 Pro Mechanical Keyboard',
        sku: 'ELEC-KBD-004',
        category: catMap['Electronics'],
        description: 'Wireless custom mechanical keyboard with hot-swappable tactile switches',
        quantity: 42,
        unitPrice: 119.50,
        supplierName: 'Keychron HK Co.',
        lowStockThreshold: 12
      },
      {
        name: 'Herman Miller Aeron Ergonomic Chair',
        sku: 'FURN-CHR-101',
        category: catMap['Furniture'],
        description: 'PostureFit SL back support, fully adjustable arms, graphite finish (Size B)',
        quantity: 14,
        unitPrice: 1295.00,
        supplierName: 'Herman Miller Office Solutions',
        lowStockThreshold: 5
      },
      {
        name: 'Electric Standing Desk 60x30',
        sku: 'FURN-DSK-102',
        category: catMap['Furniture'],
        description: 'Dual motor motorized height adjustable desk with anti-collision memory preset',
        quantity: 6,
        unitPrice: 479.00,
        supplierName: 'FlexiDesk Manufacturing',
        lowStockThreshold: 8
      },
      {
        name: 'Mobile Steel Filing Cabinet 3-Drawer',
        sku: 'FURN-CAB-103',
        category: catMap['Furniture'],
        description: 'Heavy duty lockable rolling metal cabinet for letter/legal filing folders',
        quantity: 0,
        unitPrice: 159.00,
        supplierName: 'SteelMaster Storage',
        lowStockThreshold: 6
      },
      {
        name: 'Multipurpose Copy Paper A4 (5 Reams)',
        sku: 'OFF-PAP-201',
        category: catMap['Office Supplies'],
        description: '80 GSM bright white paper case of 2500 sheets for high-speed laser printing',
        quantity: 120,
        unitPrice: 38.50,
        supplierName: 'PaperPro International',
        lowStockThreshold: 25
      },
      {
        name: 'Gel Pen Fine Point 0.5mm (Box of 24)',
        sku: 'OFF-PEN-202',
        category: catMap['Office Supplies'],
        description: 'Smooth writing quick-drying fade-proof black ink pens for daily office use',
        quantity: 9,
        unitPrice: 18.99,
        supplierName: 'Pilot Stationery Supply',
        lowStockThreshold: 15
      },
      {
        name: 'Heavy-Duty Desktop Stapler 100 Sheets',
        sku: 'OFF-STP-203',
        category: catMap['Office Supplies'],
        description: 'Steel lever mechanism manual high-capacity stapler with throat depth guide',
        quantity: 28,
        unitPrice: 34.00,
        supplierName: 'Bostitch Supplies',
        lowStockThreshold: 8
      },
      {
        name: 'DeWalt 20V MAX Cordless Drill Kit',
        sku: 'TOOL-DRL-301',
        category: catMap['Industrial Tools'],
        description: 'Brushless compact drill/driver with two 2Ah batteries, charger, and contractor bag',
        quantity: 19,
        unitPrice: 169.00,
        supplierName: 'Stanley Black & Decker',
        lowStockThreshold: 6
      },
      {
        name: 'Mitutoyo Digital Caliper 6-Inch',
        sku: 'TOOL-CAL-302',
        category: catMap['Industrial Tools'],
        description: 'Advanced on-site sensor absolute electromagnetic inductive readout 0.0005"',
        quantity: 4,
        unitPrice: 135.00,
        supplierName: 'Mitutoyo Precision Corp',
        lowStockThreshold: 5
      },
      {
        name: 'Heavy Duty Corrugated Boxes 16x12x12 (Bundle 25)',
        sku: 'PKG-BOX-401',
        category: catMap['Packaging'],
        description: '32 ECT single wall kraft brown boxes rated for 65 lbs shipping payload',
        quantity: 85,
        unitPrice: 42.00,
        supplierName: 'Uline Packaging Inc.',
        lowStockThreshold: 20
      },
      {
        name: 'Heavy Duty Packing Tape 6 Rolls',
        sku: 'PKG-TPE-402',
        category: catMap['Packaging'],
        description: '2.4 mil thickness commercial grade clear shipping packing tape with dispenser',
        quantity: 7,
        unitPrice: 24.50,
        supplierName: 'Scotch 3M Logistics',
        lowStockThreshold: 10
      },
      {
        name: 'Cushioning Bubble Wrap Roll 12" x 175ft',
        sku: 'PKG-BUB-403',
        category: catMap['Packaging'],
        description: 'Perforated every 12 inches small bubble nylon barrier film protective wrap',
        quantity: 0,
        unitPrice: 29.90,
        supplierName: 'Sealed Air Corp',
        lowStockThreshold: 10
      }
    ];

    for (const pData of productsData) {
      const prod = new Product(pData);
      await prod.save();

      // Create transaction history
      if (pData.quantity > 0) {
        await InventoryTransaction.create({
          product: prod._id,
          type: 'IN',
          quantity: pData.quantity,
          previousQuantity: 0,
          newQuantity: pData.quantity,
          reason: 'Initial stock intake',
          performedBy: adminUser._id,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000))
        });
      }
    }

    console.log(`[Seed] Seeded ${productsData.length} products and initial audit transactions successfully!`);
    console.log('[Seed] Database seeding completed.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
