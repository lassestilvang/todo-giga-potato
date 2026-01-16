import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// GET /api/lists - Get all lists
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    const where: any = {};
    // Add default user filter if not provided (TODO: Replace with actual user authentication)
    where.userId = userId || '1';

    const lists = await prisma.list.findMany({
      where,
      include: {
        tasks: {
          where: { completedAt: null },
        },
      },
      orderBy: [
        { isFavorite: 'desc' },
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(lists);
  } catch (error) {
    console.error('Error fetching lists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lists' },
      { status: 500 }
    );
  }
}

// POST /api/lists - Create new list
const createListSchema = z.object({
  name: z.string().min(1, 'List name is required'),
  emoji: z.string().optional(),
  color: z.string().optional(),
  isDefault: z.boolean().default(false),
  isFavorite: z.boolean().default(false),
  userId: z.string().min(1, 'User ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createListSchema.parse(body);

    // If this is a default list, make sure other lists are not default
    if (validatedData.isDefault) {
      await prisma.list.updateMany({
        where: { userId: validatedData.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const list = await prisma.list.create({
      data: validatedData,
      include: {
        tasks: {
          where: { completedAt: null },
        },
      },
    });

    return NextResponse.json(list, { status: 201 });
  } catch (error) {
    console.error('Error creating list:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create list' },
      { status: 500 }
    );
  }
}
