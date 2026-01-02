import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data (in development only!)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Cleaning existing data...');
    await prisma.auditLog.deleteMany();
    await prisma.aICache.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.debt.deleteMany();
    await prisma.split.deleteMany();
    await prisma.receiptItem.deleteMany();
    await prisma.receipt.deleteMany();
    await prisma.fairnessReport.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.group.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
  }

  // Create Users
  console.log('👥 Creating users...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice Johnson',
      passwordHash,
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      name: 'Bob Smith',
      passwordHash,
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    },
  });

  const charlie = await prisma.user.create({
    data: {
      email: 'charlie@example.com',
      name: 'Charlie Davis',
      passwordHash,
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
    },
  });

  const diana = await prisma.user.create({
    data: {
      email: 'diana@example.com',
      name: 'Diana Martinez',
      passwordHash,
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana',
    },
  });

  console.log('✅ Created 4 users');

  // Create Groups
  console.log('👨‍👩‍👧‍👦 Creating groups...');

  const roommates = await prisma.group.create({
    data: {
      name: 'Apartment 4B Roommates',
      description: 'Shared expenses for our apartment',
      imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=Roommates',
      members: {
        create: [
          { userId: alice.id, role: 'admin' },
          { userId: bob.id, role: 'member' },
          { userId: charlie.id, role: 'member' },
        ],
      },
    },
  });

  const weekend = await prisma.group.create({
    data: {
      name: 'Weekend Trip Squad',
      description: 'Vegas trip expenses',
      imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=Weekend',
      members: {
        create: [
          { userId: alice.id, role: 'member' },
          { userId: bob.id, role: 'admin' },
          { userId: charlie.id, role: 'member' },
          { userId: diana.id, role: 'member' },
        ],
      },
    },
  });

  console.log('✅ Created 2 groups');

  // Create Receipts with Items
  console.log('🧾 Creating receipts...');

  const receipt1 = await prisma.receipt.create({
    data: {
      imageUrl: 'https://placehold.co/600x400/png?text=Restaurant+Receipt',
      imageKey: 'receipts/sample-1.png',
      merchant: 'Olive Garden',
      total: 87.45,
      date: new Date('2024-12-20T19:30:00'),
      currency: 'USD',
      parsed: true,
      confidence: 0.95,
      parsedData: {
        items: [
          { name: 'Fettuccine Alfredo', price: 18.99 },
          { name: 'Margherita Pizza', price: 15.99 },
          { name: 'Caesar Salad', price: 9.99 },
          { name: 'Tiramisu (x2)', price: 15.98 },
          { name: 'Red Wine Bottle', price: 22.00 },
          { name: 'Tax', price: 4.50 },
        ],
      },
      uploadedBy: alice.id,
      groupId: roommates.id,
      items: {
        create: [
          { name: 'Fettuccine Alfredo', price: 18.99, quantity: 1, category: 'main' },
          { name: 'Margherita Pizza', price: 15.99, quantity: 1, category: 'main' },
          { name: 'Caesar Salad', price: 9.99, quantity: 1, category: 'appetizer' },
          { name: 'Tiramisu', price: 7.99, quantity: 2, category: 'dessert' },
          { name: 'Red Wine Bottle', price: 22.00, quantity: 1, category: 'beverage' },
          { name: 'Tax', price: 4.50, quantity: 1, category: 'tax' },
        ],
      },
    },
  });

  const receipt2 = await prisma.receipt.create({
    data: {
      imageUrl: 'https://placehold.co/600x400/png?text=Grocery+Receipt',
      imageKey: 'receipts/sample-2.png',
      merchant: 'Whole Foods',
      total: 142.67,
      date: new Date('2024-12-22T14:15:00'),
      currency: 'USD',
      parsed: true,
      confidence: 0.92,
      uploadedBy: bob.id,
      groupId: roommates.id,
      items: {
        create: [
          { name: 'Organic Milk', price: 5.99, quantity: 2, category: 'dairy' },
          { name: 'Fresh Bread', price: 4.50, quantity: 3, category: 'bakery' },
          { name: 'Chicken Breast', price: 18.99, quantity: 2, category: 'meat' },
          { name: 'Mixed Vegetables', price: 12.50, quantity: 1, category: 'produce' },
          { name: 'Pasta', price: 3.99, quantity: 4, category: 'pantry' },
          { name: 'Olive Oil', price: 15.99, quantity: 1, category: 'pantry' },
          { name: 'Coffee Beans', price: 14.99, quantity: 2, category: 'beverages' },
          { name: 'Yogurt', price: 6.99, quantity: 3, category: 'dairy' },
          { name: 'Apples', price: 8.50, quantity: 1, category: 'produce' },
        ],
      },
    },
  });

  const receipt3 = await prisma.receipt.create({
    data: {
      imageUrl: 'https://placehold.co/600x400/png?text=Hotel+Receipt',
      imageKey: 'receipts/sample-3.png',
      merchant: 'Bellagio Hotel',
      total: 780.00,
      date: new Date('2024-12-15T15:00:00'),
      currency: 'USD',
      parsed: true,
      confidence: 0.98,
      uploadedBy: bob.id,
      groupId: weekend.id,
      items: {
        create: [
          { name: 'Room - 2 Nights', price: 600.00, quantity: 1, category: 'accommodation' },
          { name: 'Room Service', price: 85.00, quantity: 1, category: 'food' },
          { name: 'Resort Fee', price: 70.00, quantity: 1, category: 'fees' },
          { name: 'Tax', price: 25.00, quantity: 1, category: 'tax' },
        ],
      },
    },
  });

  console.log('✅ Created 3 receipts with items');

  // Create Splits and Debts
  console.log('💰 Creating splits and debts...');

  // Split 1: Restaurant bill split equally among 3 people
  const split1 = await prisma.split.create({
    data: {
      receiptId: receipt1.id,
      amount: 87.45,
      percentage: 100,
      description: 'Dinner split equally',
      paidBy: alice.id,
      debts: {
        create: [
          {
            debtorId: bob.id,
            creditorId: alice.id,
            amount: 29.15, // 87.45 / 3
            settled: false,
          },
          {
            debtorId: charlie.id,
            creditorId: alice.id,
            amount: 29.15,
            settled: false,
          },
        ],
      },
    },
  });

  // Split 2: Groceries split equally
  const split2 = await prisma.split.create({
    data: {
      receiptId: receipt2.id,
      amount: 142.67,
      percentage: 100,
      description: 'Weekly groceries',
      paidBy: bob.id,
      debts: {
        create: [
          {
            debtorId: alice.id,
            creditorId: bob.id,
            amount: 47.56, // 142.67 / 3
            settled: false,
          },
          {
            debtorId: charlie.id,
            creditorId: bob.id,
            amount: 47.56,
            settled: false,
          },
        ],
      },
    },
  });

  // Split 3: Hotel split 4 ways
  const split3 = await prisma.split.create({
    data: {
      receiptId: receipt3.id,
      amount: 780.00,
      percentage: 100,
      description: 'Hotel room - Vegas trip',
      paidBy: bob.id,
      debts: {
        create: [
          {
            debtorId: alice.id,
            creditorId: bob.id,
            amount: 195.00, // 780 / 4
            settled: false,
          },
          {
            debtorId: charlie.id,
            creditorId: bob.id,
            amount: 195.00,
            settled: true, // Charlie already paid back
            settledAt: new Date('2024-12-16T10:00:00'),
          },
          {
            debtorId: diana.id,
            creditorId: bob.id,
            amount: 195.00,
            settled: false,
          },
        ],
      },
    },
  });

  console.log('✅ Created splits and debts');

  // Create some settled transactions
  console.log('💸 Creating transactions...');

  await prisma.transaction.create({
    data: {
      fromUserId: charlie.id,
      toUserId: bob.id,
      amount: 195.00,
      currency: 'USD',
      status: 'completed',
      description: 'Hotel payment - Vegas trip',
      paymentMethod: 'venmo',
      paymentId: 'venmo_12345',
      completedAt: new Date('2024-12-16T10:00:00'),
    },
  });

  await prisma.transaction.create({
    data: {
      fromUserId: alice.id,
      toUserId: bob.id,
      amount: 47.56,
      currency: 'USD',
      status: 'pending',
      description: 'Groceries share',
      paymentMethod: 'venmo',
    },
  });

  console.log('✅ Created 2 transactions');

  // Create Fairness Report
  console.log('📊 Creating fairness report...');

  await prisma.fairnessReport.create({
    data: {
      groupId: roommates.id,
      giniCoefficient: 0.23,
      fairnessScore: 85.5,
      totalSpent: 230.12,
      avgPerPerson: 76.71,
      maxImbalance: 18.44,
      insights: [
        'The group maintains good spending balance',
        'Alice has paid for 38% of expenses this month',
        'Bob and Charlie have similar spending patterns',
      ],
      suggestions: [
        {
          type: 'rotation',
          message: 'Consider letting Bob choose the next dinner spot since Alice paid last time',
        },
        {
          type: 'settlement',
          message: 'Charlie owes Alice $29.15 - suggest settling this week',
        },
      ],
      participantStats: {
        alice: { totalPaid: 87.45, totalOwed: 47.56, netPosition: 39.89 },
        bob: { totalPaid: 922.67, totalOwed: 29.15, netPosition: 893.52 },
        charlie: { totalPaid: 0, totalOwed: 76.71, netPosition: -76.71 },
      },
      periodStart: new Date('2024-12-01'),
      periodEnd: new Date('2024-12-31'),
    },
  });

  console.log('✅ Created fairness report');

  // Create Audit Logs
  console.log('📝 Creating audit logs...');

  await prisma.auditLog.createMany({
    data: [
      {
        userId: alice.id,
        action: 'user_login',
        resource: 'auth',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        success: true,
      },
      {
        userId: alice.id,
        action: 'receipt_upload',
        resource: 'receipts',
        resourceId: receipt1.id,
        metadata: { fileSize: 245678, mimeType: 'image/png' },
        ipAddress: '192.168.1.100',
        success: true,
      },
      {
        userId: bob.id,
        action: 'debt_calculate',
        resource: 'debts',
        metadata: { receiptId: receipt2.id, participantCount: 3 },
        success: true,
      },
    ],
  });

  console.log('✅ Created audit logs');

  // Create AI Cache entries
  console.log('🧠 Creating AI cache...');

  await prisma.aICache.create({
    data: {
      cacheKey: 'receipt_parse_abc123',
      cacheType: 'receipt_parse',
      input: {
        imageUrl: 'https://example.com/receipt.jpg',
        confidence: 0.95,
      },
      output: {
        merchant: 'Olive Garden',
        total: 87.45,
        items: [
          { name: 'Fettuccine Alfredo', price: 18.99 },
          { name: 'Margherita Pizza', price: 15.99 },
        ],
      },
      hitCount: 5,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  console.log('✅ Created AI cache');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Users: 4 (alice, bob, charlie, diana)`);
  console.log(`   - Groups: 2 (Roommates, Weekend Trip)`);
  console.log(`   - Receipts: 3 with multiple items`);
  console.log(`   - Debts: 6 (1 settled, 5 pending)`);
  console.log(`   - Transactions: 2 (1 completed, 1 pending)`);
  console.log(`   - Fairness Reports: 1`);
  console.log(`   - Audit Logs: 3`);
  console.log(`\n🔐 Test credentials:`);
  console.log(`   Email: alice@example.com | Password: password123`);
  console.log(`   Email: bob@example.com   | Password: password123`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
