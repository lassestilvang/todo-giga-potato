import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// GET /api/tasks/[id] - Get single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        list: true,
        labels: true,
        subtasks: true,
        attachments: true,
        reminders: true,
        history: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[id] - Update task
const updateTaskSchema = z.object({
  name: z.string().min(1, 'Task name is required').optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  deadline: z.string().optional(),
  estimates: z.number().optional(),
  actualTime: z.number().optional(),
  priority: z.number().optional(),
  isRecurring: z.boolean().optional(),
  recurringPattern: z.string().optional(),
  completedAt: z.string().optional(),
  listId: z.string().optional(),
  userId: z.string().optional(),
  labels: z.array(z.string()).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    const { labels, ...taskData } = validatedData;

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...taskData,
        ...(taskData.date ? { date: new Date(taskData.date) } : {}),
        ...(taskData.deadline ? { deadline: new Date(taskData.deadline) } : {}),
        ...(taskData.completedAt ? { completedAt: new Date(taskData.completedAt) } : {}),
        labels: labels ? {
          set: labels.map((labelId: string) => ({ id: labelId })),
        } : undefined,
      },
      include: {
        list: true,
        labels: true,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    if (error instanceof Error && error.message.includes('NotFound')) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    
    if (error instanceof Error && error.message.includes('NotFound')) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
