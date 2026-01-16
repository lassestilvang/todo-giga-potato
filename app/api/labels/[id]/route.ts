import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// GET /api/labels/[id] - Get single label
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const label = await prisma.label.findUnique({
      where: { id },
      include: {
        tasks: true,
      },
    });

    if (!label) {
      return NextResponse.json(
        { error: 'Label not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(label);
  } catch (error) {
    console.error('Error fetching label:', error);
    return NextResponse.json(
      { error: 'Failed to fetch label' },
      { status: 500 }
    );
  }
}

// PUT /api/labels/[id] - Update label
const updateLabelSchema = z.object({
  name: z.string().min(1, 'Label name is required').optional(),
  color: z.string().min(1, 'Label color is required').optional(),
  userId: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const validatedData = updateLabelSchema.parse(body);

    const label = await prisma.label.update({
      where: { id },
      data: validatedData,
      include: {
        tasks: true,
      },
    });

    return NextResponse.json(label);
  } catch (error) {
    console.error('Error updating label:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    if (error instanceof Error && error.message.includes('NotFound')) {
      return NextResponse.json(
        { error: 'Label not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update label' },
      { status: 500 }
    );
  }
}

// DELETE /api/labels/[id] - Delete label
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Remove label from all tasks
    const tasksWithLabel = await prisma.task.findMany({
      where: { labels: { some: { id } } },
      include: { labels: true },
    });

    for (const task of tasksWithLabel) {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          labels: {
            set: task.labels.filter(label => label.id !== id).map(label => ({ id: label.id })),
          },
        },
      });
    }

    // Delete the label
    await prisma.label.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Label deleted successfully' });
  } catch (error) {
    console.error('Error deleting label:', error);
    
    if (error instanceof Error && error.message.includes('NotFound')) {
      return NextResponse.json(
        { error: 'Label not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete label' },
      { status: 500 }
    );
  }
}
