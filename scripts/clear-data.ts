import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearData() {
  console.log('🧹 Clearing all data except users...');

  try {
    // Delete in correct order (respecting foreign keys)
    await prisma.auditLog.deleteMany();
    console.log('✅ Deleted audit logs');

    await prisma.aICache.deleteMany();
    console.log('✅ Deleted AI cache');

    await prisma.transaction.deleteMany();
    console.log('✅ Deleted transactions');

    await prisma.debt.deleteMany();
    console.log('✅ Deleted debts');

    await prisma.split.deleteMany();
    console.log('✅ Deleted splits');

    await prisma.receiptItem.deleteMany();
    console.log('✅ Deleted receipt items');

    await prisma.receipt.deleteMany();
    console.log('✅ Deleted receipts');

    await prisma.fairnessReport.deleteMany();
    console.log('✅ Deleted fairness reports');

    await prisma.groupMember.deleteMany();
    console.log('✅ Deleted group members');

    await prisma.group.deleteMany();
    console.log('✅ Deleted groups');

    console.log('\n✅ All data cleared! User accounts remain intact.');
    console.log('\nYou can now:');
    console.log('1. Upload real receipts');
    console.log('2. Create your own groups');
    console.log('3. Test with fresh data');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearData();
