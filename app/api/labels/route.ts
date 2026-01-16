import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// GET /api/labels - Get all labels
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    const where: any = {};
    // Add default user filter if not provided (TODO: Replace with actual user authentication)
    where.userId = userId || '1';

    const labels = await prisma.label.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(labels);
  } catch (error) {
    console.error('Error fetching labels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch labels' },
      { status: 500 }
    );
  }
}

// POST /api/labels - Create new label
const createLabelSchema = z.object({
  name: z.string().min(1, 'Label name is required'),
  color: z.string().min(1, 'Label color is required'),
  userId: z.string().min(1, 'User ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createLabelSchema.parse(body);

    const label = await prisma.label.create({
      data: validatedData,
    });

    return NextResponse.json(label, { status: 201 });
  } catch (error) {
    console.error('Error creating label:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create label' },
      { status: 500 }
    );
  }
}
