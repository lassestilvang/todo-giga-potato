import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// GET /api/lists/[id] - Get single list
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const list = await prisma.list.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            labels: true,
            reminders: true,
          },
          orderBy: [
            { completedAt: 'asc' }, // Incomplete tasks first
            { priority: 'desc' },
            { createdAt: 'desc' },
          ],
        },
      },
    });

    if (!list) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(list);
  } catch (error) {
    console.error('Error fetching list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch list' },
      { status: 500 }
    );
  }
}

// PUT /api/lists/[id] - Update list
const updateListSchema = z.object({
  name: z.string().min(1, 'List name is required').optional(),
  emoji: z.string().optional(),
  color: z.string().optional(),
  isDefault: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  userId: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const validatedData = updateListSchema.parse(body);

    // If this is a default list, make sure other lists are not default
    if (validatedData.isDefault) {
      const list = await prisma.list.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (list) {
        await prisma.list.updateMany({
          where: {
            userId: list.userId,
            id: { not: id },
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }
    }

    const updatedList = await prisma.list.update({
      where: { id },
      data: validatedData,
      include: {
        tasks: {
          where: { completedAt: null },
        },
      },
    });

    return NextResponse.json(updatedList);
  } catch (error) {
    console.error('Error updating list:', error instanceof Error ? error.message : 'Unknown error');
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    // Handle Prisma errors
    const prismaError = error as any;
    if (prismaError.code === 'P2025') { // Record not found
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update list' },
      { status: 500 }
    );
  }
}

// DELETE /api/lists/[id] - Delete list
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Find list with user info
    const list = await prisma.list.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!list) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      );
    }

    // Find default list to move tasks to
    const defaultList = await prisma.list.findFirst({
      where: {
        userId: list.userId,
        isDefault: true,
        id: { not: id },
      },
    });

    // Move tasks to default list or delete them
    if (defaultList) {
      await prisma.task.updateMany({
        where: { listId: id },
        data: { listId: defaultList.id },
      });
    } else {
      // If no default list, delete all tasks in this list
      await prisma.task.deleteMany({
        where: { listId: id },
      });
    }

    // Delete the list
    await prisma.list.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'List deleted successfully' });
  } catch (error) {
    console.error('Error deleting list:', error);
    
    // Handle Prisma errors
    const prismaError = error as any;
    if (prismaError.code === 'P2025') { // Record not found
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete list' },
      { status: 500 }
    );
  }
}
