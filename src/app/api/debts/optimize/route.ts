import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { DebtOptimizerAgent } from '@/agents/DebtOptimizerAgent';
import { prisma } from '@/lib/db';

const OptimizeDebtsSchema = z.object({
  groupId: z.string(),
  minimumAmount: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
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
