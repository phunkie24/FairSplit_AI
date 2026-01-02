import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Fetch all receipts
    const receipts = await prisma.receipt.findMany({
      include: {
        items: true,
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ receipts });
  } catch (error: any) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receipts' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Get or create a demo user for development
    let demoUser = await prisma.user.findUnique({
      where: { email: 'alice@example.com' },
    });

    // If no users exist (database not seeded), create one
    if (!demoUser) {
      demoUser = await prisma.user.create({
        data: {
          email: 'demo@example.com',
          name: 'Demo User',
          passwordHash: 'demo-hash',
        },
      });
    }

    // For now, we'll use a data URL as the image URL
    // In production, you'd upload this to S3 or similar
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Create receipt record (without parsing yet)
    const receipt = await prisma.receipt.create({
      data: {
        imageUrl: dataUrl,
        imageKey: file.name,
        total: 0,
        date: new Date(),
        parsed: false,
        uploadedBy: demoUser.id,
      },
    });

    return NextResponse.json({
      success: true,
      receipt: {
        id: receipt.id,
        imageUrl: receipt.imageUrl,
      },
    });
  } catch (error: any) {
    console.error('Error uploading receipt:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload receipt' },
      { status: 500 }
    );
  }
}