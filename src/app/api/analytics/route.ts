import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Fetch all receipts
    const receipts = await prisma.receipt.findMany({
      where: { parsed: true },
      include: {
        uploader: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Fetch all groups
    const groups = await prisma.group.findMany();

    // Fetch all debts
    const debts = await prisma.debt.findMany({
      where: { settled: false }
    });

    // Calculate stats
    const totalReceipts = receipts.length;
    const totalSpent = receipts.reduce((sum, r) => sum + (r.total || 0), 0);
    const totalGroups = groups.length;
    const pendingDebts = debts.reduce((sum, d) => sum + d.amount, 0);

    // Recent receipts for chart
    const recentReceipts = receipts.slice(0, 5).map(r => ({
      merchant: r.merchant || 'Unknown',
      total: r.total || 0,
      date: r.date.toISOString()
    }));

    // Top spenders
    const spenderMap = new Map<string, number>();
    receipts.forEach(r => {
      const name = r.uploader?.name || r.uploader?.email || 'Unknown';
      spenderMap.set(name, (spenderMap.get(name) || 0) + (r.total || 0));
    });

    const topSpenders = Array.from(spenderMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return NextResponse.json({
      totalReceipts,
      totalSpent,
      totalGroups,
      pendingDebts,
      recentReceipts,
      topSpenders
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
