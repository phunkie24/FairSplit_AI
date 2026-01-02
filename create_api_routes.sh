#!/bin/bash

BASE_DIR="/home/claude/fairsplit-ai"
cd $BASE_DIR

# Create API route for receipt parsing
mkdir -p src/app/api/receipts/parse
cat > src/app/api/receipts/parse/route.ts << 'TYPESCRIPT'
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { ReceiptScannerAgent } from '@/agents/ReceiptScannerAgent';
import { checkRateLimit } from '@/lib/redis';

const ParseReceiptSchema = z.object({
  receiptId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const { allowed, remaining } = await checkRateLimit(session.user.id, 10, 60);
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

    // Authorization check
    if (receipt.uploadedBy !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Run scanner agent
    const agent = new ReceiptScannerAgent();
    const parsed = await agent.run({ imageUrl: receipt.imageUrl }, session.user.id);

    // Update database
    const updated = await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        parsed: true,
        parsedData: parsed,
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
  } catch (error) {
    console.error('Receipt parse error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
TYPESCRIPT

# Create API route for debt optimization
mkdir -p src/app/api/debts/optimize
cat > src/app/api/debts/optimize/route.ts << 'TYPESCRIPT'
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { DebtOptimizerAgent } from '@/agents/DebtOptimizerAgent';
import { prisma } from '@/lib/db';

const OptimizeDebtsSchema = z.object({
  groupId: z.string(),
  minimumAmount: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { groupId, minimumAmount } = OptimizeDebtsSchema.parse(body);

    // Fetch all unsettled debts for the group
    const debts = await prisma.debt.findMany({
      where: {
        settled: false,
        split: {
          receipt: {
            groupId: groupId,
          },
        },
      },
      include: {
        debtor: true,
        creditor: true,
      },
    });

    if (debts.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          originalTransactions: 0,
          optimizedTransactions: 0,
          transactions: [],
          saved: 0,
          totalAmount: 0,
          balances: {},
        },
      });
    }

    // Convert to agent format
    const debtInput = debts.map(d => ({
      from: d.debtorId,
      to: d.creditorId,
      amount: d.amount,
    }));

    // Run optimizer agent
    const agent = new DebtOptimizerAgent();
    const optimized = await agent.run({
      debts: debtInput,
      minimumAmount,
    }, session.user.id);

    return NextResponse.json({ success: true, data: optimized });
  } catch (error) {
    console.error('Debt optimize error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
TYPESCRIPT

# Create API route for fairness analysis
mkdir -p src/app/api/analytics/fairness
cat > src/app/api/analytics/fairness/route.ts << 'TYPESCRIPT'
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { EmotionalIntelligenceAgent } from '@/agents/EmotionalIntelligenceAgent';
import { prisma } from '@/lib/db';

const FairnessAnalysisSchema = z.object({
  groupId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { groupId } = FairnessAnalysisSchema.parse(body);

    // Fetch group with members
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: { user: true },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Calculate spending patterns for each member
    const patterns = await Promise.all(
      group.members.map(async member => {
        const paid = await prisma.split.aggregate({
          where: {
            paidBy: member.userId,
            receipt: { groupId: groupId },
          },
          _sum: { amount: true },
          _count: true,
        });

        const owed = await prisma.debt.aggregate({
          where: {
            debtorId: member.userId,
            settled: false,
            split: {
              receipt: { groupId: groupId },
            },
          },
          _sum: { amount: true },
        });

        const totalPaid = paid._sum.amount || 0;
        const totalOwed = owed._sum.amount || 0;
        const transactionCount = paid._count || 0;

        return {
          userId: member.userId,
          userName: member.user.name || member.user.email,
          totalPaid,
          totalOwed,
          netPosition: totalPaid - totalOwed,
          transactionCount,
          avgTransactionSize: transactionCount > 0 ? totalPaid / transactionCount : 0,
        };
      })
    );

    // Run emotional intelligence agent
    const agent = new EmotionalIntelligenceAgent();
    const analysis = await agent.run({
      patterns,
      groupName: group.name,
      timeframeDesc: 'all time',
    }, session.user.id);

    return NextResponse.json({ success: true, data: analysis });
  } catch (error) {
    console.error('Fairness analysis error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
TYPESCRIPT

echo "✅ API routes created"
