import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// GET /api/reminders/[id] - Get single reminder
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const reminder = await prisma.reminder.findUnique({
      where: { id },
    });

    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(reminder);
  } catch (error) {
    console.error('Error fetching reminder:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminder' },
      { status: 500 }
    );
  }
}

// PUT /api/reminders/[id] - Update reminder
const updateReminderSchema = z.object({
  datetime: z.string().optional(),
  taskId: z.string().min(1, 'Task ID is required').optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const validatedData = updateReminderSchema.parse(body);

    // Validate date if provided
    if (validatedData.datetime) {
      const date = new Date(validatedData.datetime);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: 'Validation error', details: [{ path: ['datetime'], message: 'Invalid date format' }] },
          { status: 400 }
        );
      }
    }

    const reminder = await prisma.reminder.update({
      where: { id },
      data: {
        ...validatedData,
        ...(validatedData.datetime ? { datetime: new Date(validatedData.datetime) } : {}),
      },
    });

    return NextResponse.json(reminder);
  } catch (error) {
    console.error('Error updating reminder:', error instanceof Error ? error.message : 'Unknown error');
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    const prismaError = error as any;
    if (prismaError.code === 'P2025') { // Record not found
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update reminder' },
      { status: 500 }
    );
  }
}

// DELETE /api/reminders/[id] - Delete reminder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.reminder.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    
    const prismaError = error as any;
    if (prismaError.code === 'P2025') { // Record not found
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete reminder' },
      { status: 500 }
    );
  }
}
