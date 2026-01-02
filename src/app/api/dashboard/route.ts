import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Fetch receipts with groups
    const receipts = await prisma.receipt.findMany({
      where: { parsed: true },
      include: {
        group: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch groups
    const groups = await prisma.group.findMany();

    // Fetch pending debts
    const debts = await prisma.debt.findMany({
      where: { settled: false }
    });

    // Calculate stats
    const totalReceipts = receipts.length;
    const activeGroups = groups.length;
    const pendingDebts = debts.reduce((sum, d) => sum + d.amount, 0);
    const totalSpent = receipts.reduce((sum, r) => sum + (r.total || 0), 0);

    // Recent activity (last 5 receipts)
    const recentActivity = receipts.slice(0, 5).map(r => ({
      id: r.id,
      merchant: r.merchant || 'Unknown',
      group: r.group?.name || null,
      total: r.total || 0,
      date: r.date.toISOString()
    }));

    return NextResponse.json({
      totalReceipts,
      activeGroups,
      pendingDebts,
      totalSpent,
      recentActivity
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      {
        totalReceipts: 0,
        activeGroups: 0,
        pendingDebts: 0,
        totalSpent: 0,
        recentActivity: []
      },
      { status: 500 }
    );
  }
}
