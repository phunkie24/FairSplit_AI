import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { EmotionalIntelligenceAgent } from '@/agents/EmotionalIntelligenceAgent';
import { prisma } from '@/lib/db';

const FairnessAnalysisSchema = z.object({
  groupId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
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
