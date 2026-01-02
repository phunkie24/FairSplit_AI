import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const CreateGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = CreateGroupSchema.parse(body);

    // Create group in database
    const group = await prisma.group.create({
      data: {
        name: validated.name,
        description: validated.description || '',
      },
    });

    return NextResponse.json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
      },
    });
  } catch (error: any) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create group' },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const groups = await prisma.group.findMany({
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        receipts: {
          include: {
            splits: {
              include: {
                debts: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate stats for each group
    const groupsWithStats = groups.map((group) => {
      const totalExpenses = group.receipts.reduce(
        (sum: number, receipt: any) => sum + (receipt.total || 0),
        0
      );

      // Get all debts from receipts -> splits -> debts
      const allDebts = group.receipts.flatMap((receipt: any) =>
        receipt.splits.flatMap((split: any) => split.debts)
      );

      const pendingDebts = allDebts
        .filter((debt: any) => !debt.settled)
        .reduce((sum: number, debt: any) => sum + debt.amount, 0);

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        memberCount: group.members.length,
        totalExpenses,
        pendingDebts,
        members: group.members.map((m: any) => m.user),
      };
    });

    return NextResponse.json({ groups: groupsWithStats });
  } catch (error: any) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}