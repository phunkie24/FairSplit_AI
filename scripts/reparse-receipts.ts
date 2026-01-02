import { prisma } from '../src/lib/db';

async function reparseReceipts() {
  console.log('🔄 Re-parsing all receipts with new merchant extraction logic...\n');

  // Find all parsed receipts
  const receipts = await prisma.receipt.findMany({
    where: { parsed: true },
    include: { items: true },
  });

  console.log(`Found ${receipts.length} receipts to re-parse\n`);

  for (const receipt of receipts) {
    console.log(`\n📄 Processing receipt ID: ${receipt.id}`);
    console.log(`   Current merchant: ${receipt.merchant}`);
    console.log(`   Image key: ${receipt.imageKey}`);

    // Extract merchant from filename
    let merchantName = 'Unknown Merchant';
    if (receipt.imageKey) {
      const cleanName = receipt.imageKey
        .replace(/\.[^/.]+$/, '') // Remove extension
        .replace(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
        .replace(/\d+/g, '') // Remove numbers
        .trim();

      if (cleanName.length > 0) {
        merchantName = cleanName
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
    }

    console.log(`   ✅ New merchant: ${merchantName}`);

    // Update the receipt
    await prisma.receipt.update({
      where: { id: receipt.id },
      data: { merchant: merchantName },
    });
  }

  console.log('\n\n✨ Done! All receipts have been re-parsed with merchant names from filenames.');
  console.log('🔄 Refresh your receipts page to see the changes!\n');
}

reparseReceipts()
  .catch((error) => {
    console.error('Error re-parsing receipts:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
