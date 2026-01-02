import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Fetch all receipts with items
    const receipts = await prisma.receipt.findMany({
      where: { parsed: true },
      include: {
        uploader: {
          select: { name: true, email: true }
        },
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch all groups
    const groups = await prisma.group.findMany({
      include: {
        receipts: true
      }
    });

    // Fetch all debts
    const allDebts = await prisma.debt.findMany();

    // Calculate basic stats
    const totalReceipts = receipts.length;
    const totalSpent = receipts.reduce((sum, r) => sum + (r.total || 0), 0);
    const totalGroups = groups.length;
    const settledDebts = allDebts.filter(d => d.settled).reduce((sum, d) => sum + d.amount, 0);
    const pendingDebts = allDebts.filter(d => !d.settled).reduce((sum, d) => sum + d.amount, 0);

    // Recent receipts for spending chart
    const recentReceipts = receipts.slice(0, 10).map(r => ({
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

    // Category breakdown
    const categoryMap = new Map<string, { total: number; count: number }>();
    receipts.forEach(r => {
      r.items.forEach(item => {
        const category = item.category || 'other';
        const current = categoryMap.get(category) || { total: 0, count: 0 };
        categoryMap.set(category, {
          total: current.total + item.price,
          count: current.count + 1
        });
      });
    });

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Monthly spending
    const monthlyMap = new Map<string, number>();
    receipts.forEach(r => {
      const month = new Date(r.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + (r.total || 0));
    });

    const monthlySpending = Array.from(monthlyMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6); // Last 6 months

    // Group activity
    const groupActivity = groups.map(g => ({
      group: g.name,
      receipts: g.receipts.length,
      total: g.receipts.reduce((sum, r) => sum + (r.total || 0), 0)
    })).sort((a, b) => b.total - a.total).slice(0, 5);

    // Debt status
    const debtStatus = {
      settled: settledDebts,
      pending: pendingDebts
    };

    return NextResponse.json({
      totalReceipts,
      totalSpent,
      totalGroups,
      pendingDebts,
      recentReceipts,
      topSpenders,
      categoryBreakdown,
      monthlySpending,
      groupActivity,
      debtStatus
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics',
        totalReceipts: 0,
        totalSpent: 0,
        totalGroups: 0,
        pendingDebts: 0,
        recentReceipts: [],
        topSpenders: [],
        categoryBreakdown: [],
        monthlySpending: [],
        groupActivity: [],
        debtStatus: { settled: 0, pending: 0 }
      },
      { status: 500 }
    );
  }
}
