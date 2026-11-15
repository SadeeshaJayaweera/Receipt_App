const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/juice-receipt-app';

async function seed() {
  console.log('Connecting to MongoDB at', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const User = require('../backend/src/models/User');
  const Flavour = require('../backend/src/models/Flavour');
  const Receipt = require('../backend/src/models/Receipt');
  const ReceiptCounter = require('../backend/src/models/ReceiptCounter');

  // Clean collections
  await User.deleteMany({});
  await Flavour.deleteMany({});
  await Receipt.deleteMany({});
  await ReceiptCounter.deleteMany({});
  console.log('Cleared existing collections.');

  // Create demo user
  const demoUser = await User.create({
    businessName: 'Fresh Citrus Juice Bar & Café',
    email: 'admin@citrusjuice.com',
    password: 'Password123!',
    phone: '+94 77 123 4567',
    address: '42 Galle Face Green Promenade, Colombo 03, Sri Lanka',
    defaultCurrency: 'LKR',
    taxEnabled: true,
    taxRate: 8.0,
    receiptFooter: 'Thank you for choosing Fresh Citrus! Freshly squeezed with love every day. Follow us @citrusjuicebar',
    tagline: 'Pure, Natural & Refreshingly Cold',
    website: 'https://citrusjuicebar.lk',
    receiptPrefix: 'CITRUS',
    showLogo: true,
    logoIcon: '🍊',
    showCustomerInfo: true
  });
  console.log('Created User:', demoUser.email, 'ID:', demoUser._id);

  // Initialize receipt counter
  const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
  await ReceiptCounter.create({
    userId: demoUser._id,
    prefix: 'CITRUS',
    period: yearMonth,
    seq: 104
  });

  // Create flavours
  const flavoursData = [
    {
      userId: demoUser._id,
      name: 'Avocado Lime Smoothie',
      price: 850,
      category: 'Speciality Blends',
      description: 'Creamy Hass avocado blended with fresh key lime juice, condensed milk, and honey.',
      sku: 'AVO-01',
      isAvailable: true
    },
    {
      userId: demoUser._id,
      name: 'Mango Passion Cooler',
      price: 750,
      category: 'Tropical Crushes',
      description: 'Sun-ripened Alphonso mango chunks pureed with tangy passion fruit pulp and crushed ice.',
      sku: 'MNG-02',
      isAvailable: true
    },
    {
      userId: demoUser._id,
      name: 'Dragonfruit Lychee Fizz',
      price: 900,
      category: 'Exotic Mocktails',
      description: 'Vibrant pink pitaya paired with delicate sweet lychee, sparkling soda, and mint leaves.',
      sku: 'DRG-03',
      isAvailable: true
    },
    {
      userId: demoUser._id,
      name: 'Fresh King Coconut Lime',
      price: 500,
      category: 'Fresh Juice',
      description: 'Pure Ceylon king coconut water infused with freshly squeezed lime and kithul treacle.',
      sku: 'KNG-04',
      isAvailable: true
    },
    {
      userId: demoUser._id,
      name: 'Papaya Ginger Sunrise',
      price: 650,
      category: 'Wellness & Detox',
      description: 'Organic red papaya with cold-pressed ginger root, a splash of orange juice, and chia seeds.',
      sku: 'PAP-05',
      isAvailable: true
    },
    {
      userId: demoUser._id,
      name: 'Watermelon Mint Splash',
      price: 600,
      category: 'Fresh Juice',
      description: 'Crisp chilled watermelon cold-pressed with sweet garden mint and Himalayan pink salt.',
      sku: 'WTR-06',
      isAvailable: true
    },
    {
      userId: demoUser._id,
      name: 'Strawberry Guava Blast',
      price: 800,
      category: 'Tropical Crushes',
      description: 'Highland fresh strawberries blended with pink guava nectar and a touch of agave.',
      sku: 'STR-07',
      isAvailable: true
    },
    {
      userId: demoUser._id,
      name: 'Golden Pineapple Turmeric',
      price: 700,
      category: 'Wellness & Detox',
      description: 'Sweet local pineapple juice infused with organic turmeric, black pepper, and lime.',
      sku: 'PIN-08',
      isAvailable: true
    }
  ];

  const flavours = await Flavour.insertMany(flavoursData);
  console.log(`Created ${flavours.length} juice flavours.`);

  // Create sample receipts across past days
  const now = new Date();
  const d1 = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
  const d2 = new Date(now.getTime() - 5 * 60 * 60 * 1000); // 5 hours ago
  const d3 = new Date(now.getTime() - 24 * 60 * 60 * 1000); // yesterday
  const d4 = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 2 days ago

  const receiptsData = [
    {
      userId: demoUser._id,
      receiptNumber: 'CITRUS-000101',
      currency: 'LKR',
      status: 'issued',
      items: [
        {
          flavourId: flavours[0]._id,
          flavourName: flavours[0].name,
          quantity: 2,
          price: 850,
          subtotal: 1700
        },
        {
          flavourId: flavours[1]._id,
          flavourName: flavours[1].name,
          quantity: 1,
          price: 750,
          subtotal: 750
        }
      ],
      subtotal: 2450,
      discount: 0,
      taxRate: 8.0,
      taxAmount: 196,
      totalAmount: 2646,
      paymentMethod: 'cash',
      amountPaid: 3000,
      changeGiven: 354,
      customerName: 'Kavinda Perera',
      customerPhone: '+94 71 889 9123',
      notes: 'Less ice on the mango passion cooler, extra lime.',
      createdAt: d1,
      updatedAt: d1
    },
    {
      userId: demoUser._id,
      receiptNumber: 'CITRUS-000102',
      currency: 'LKR',
      status: 'issued',
      items: [
        {
          flavourId: flavours[2]._id,
          flavourName: flavours[2].name,
          quantity: 3,
          price: 900,
          subtotal: 2700
        },
        {
          flavourId: flavours[5]._id,
          flavourName: flavours[5].name,
          quantity: 2,
          price: 600,
          subtotal: 1200
        }
      ],
      subtotal: 3900,
      discount: 200,
      taxRate: 8.0,
      taxAmount: 296,
      totalAmount: 3996,
      paymentMethod: 'card',
      amountPaid: 3996,
      changeGiven: 0,
      customerName: 'Ananya Sharma',
      customerPhone: '+94 76 543 2100',
      notes: 'Corporate meeting refreshments takeaway.',
      createdAt: d2,
      updatedAt: d2
    },
    {
      userId: demoUser._id,
      receiptNumber: 'CITRUS-000103',
      currency: 'LKR',
      status: 'issued',
      items: [
        {
          flavourId: flavours[3]._id,
          flavourName: flavours[3].name,
          quantity: 4,
          price: 500,
          subtotal: 2000
        },
        {
          flavourId: flavours[4]._id,
          flavourName: flavours[4].name,
          quantity: 2,
          price: 650,
          subtotal: 1300
        }
      ],
      subtotal: 3300,
      discount: 0,
      taxRate: 8.0,
      taxAmount: 264,
      totalAmount: 3564,
      paymentMethod: 'mobile',
      amountPaid: 3564,
      changeGiven: 0,
      customerName: 'Dilshan Silva',
      customerPhone: '+94 77 987 6543',
      notes: 'Table 4 dine-in.',
      createdAt: d3,
      updatedAt: d3
    },
    {
      userId: demoUser._id,
      receiptNumber: 'CITRUS-000104',
      currency: 'LKR',
      status: 'voided',
      voidedAt: d4,
      voidReason: 'Customer changed drink selection before blending started.',
      voidedBy: demoUser._id,
      statusHistory: [
        {
          fromStatus: 'draft',
          toStatus: 'issued',
          changedAt: d4,
          reason: 'Initial issue',
          changedBy: demoUser._id
        },
        {
          fromStatus: 'issued',
          toStatus: 'voided',
          changedAt: d4,
          reason: 'Customer changed drink selection before blending started.',
          changedBy: demoUser._id
        }
      ],
      items: [
        {
          flavourId: flavours[6]._id,
          flavourName: flavours[6].name,
          quantity: 1,
          price: 800,
          subtotal: 800
        }
      ],
      subtotal: 800,
      discount: 0,
      taxRate: 8.0,
      taxAmount: 64,
      totalAmount: 864,
      paymentMethod: 'cash',
      amountPaid: 1000,
      changeGiven: 136,
      customerName: 'Walk-in Guest',
      notes: 'Voided order.',
      createdAt: d4,
      updatedAt: d4
    }
  ];

  await Receipt.insertMany(receiptsData);
  console.log(`Created ${receiptsData.length} sample receipts.`);

  console.log('\n--- SEED COMPLETE ---');
  console.log('Login credentials:');
  console.log('Email: admin@citrusjuice.com');
  console.log('Password: Password123!');
  console.log('---------------------');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
