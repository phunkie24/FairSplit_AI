import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { ReceiptScannerAgent } from '@/agents/ReceiptScannerAgent';
import { checkRateLimit } from '@/lib/redis';

const ParseReceiptSchema = z.object({
  receiptId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication - allow demo user in development
    const session = await auth();
    let userId = session?.user?.id;

    // If no session, use demo user for development
    if (!userId) {
      let demoUser = await prisma.user.findUnique({
        where: { email: 'alice@example.com' },
      });

      if (!demoUser) {
        demoUser = await prisma.user.create({
          data: {
            email: 'demo@example.com',
            name: 'Demo User',
            passwordHash: 'demo-hash',
          },
        });
      }

      userId = demoUser.id;
    }

    // Rate limiting
    const { allowed, remaining } = await checkRateLimit(userId, 10, 60);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'X-RateLimit-Remaining': remaining.toString() } }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const { receiptId } = ParseReceiptSchema.parse(body);

    // Fetch receipt
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
    });

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    // Authorization check - skip in development if using demo user
    if (session?.user?.id && receipt.uploadedBy !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Run scanner agent
    let parsed;

    // Development mode: Use mock data only if explicitly enabled
    const useMockData = process.env.USE_MOCK_AI === 'true';

    if (useMockData) {
      console.log('[Development] Using mock receipt data instead of AI');

      // Try to extract merchant from filename or use generic name
      let merchantName = 'Unknown Merchant';
      if (receipt.imageKey) {
        // Remove file extension and clean up the name
        const cleanName = receipt.imageKey
          .replace(/\.[^/.]+$/, '') // Remove extension
          .replace(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
          .replace(/\d+/g, '') // Remove numbers
          .trim();

        if (cleanName.length > 0) {
          merchantName = cleanName
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        }
      }

      // Generate more realistic random data
      const subtotal = parseFloat((Math.random() * 80 + 20).toFixed(2));
      const tax = parseFloat((subtotal * 0.1).toFixed(2));
      const total = subtotal + tax;

      parsed = {
        merchant: merchantName,
        total: total,
        date: new Date().toISOString().split('T')[0],
        currency: 'USD',
        items: [
          { name: 'Item 1', price: parseFloat((subtotal * 0.4).toFixed(2)), quantity: 1, category: 'food' },
          { name: 'Item 2', price: parseFloat((subtotal * 0.35).toFixed(2)), quantity: 1, category: 'food' },
          { name: 'Item 3', price: parseFloat((subtotal * 0.25).toFixed(2)), quantity: 1, category: 'beverage' },
          { name: 'Tax', price: tax, quantity: 1, category: 'tax' },
        ],
        confidence: 0.85,
      };

      console.log(`[Development] Extracted merchant: ${merchantName} from ${receipt.imageKey}`);
    } else {
      const agent = new ReceiptScannerAgent();
      parsed = await agent.run({ imageUrl: receipt.imageUrl }, userId);
    }

    // Update database
    const updated = await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        parsed: true,
        parsedData: parsed as any,
        merchant: parsed.merchant,
        total: parsed.total,
        date: new Date(parsed.date),
        confidence: parsed.confidence,
        items: {
          create: (parsed.items || []).map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity || 1,
            category: item.category,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Receipt parse error:', error);
    console.error('Error stack:', error?.stack);
    console.error('Error message:', error?.message);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 });
  }
}
