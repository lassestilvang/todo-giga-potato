import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// GET /api/reminders - Get all reminders
const getRemindersQuerySchema = z.object({
  taskId: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = getRemindersQuerySchema.parse(Object.fromEntries(searchParams.entries()));

    const { page, limit, taskId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (taskId) where.taskId = taskId;

    const [reminders, total] = await Promise.all([
      prisma.reminder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { datetime: 'asc' },
      }),
      prisma.reminder.count({ where }),
    ]);

    return NextResponse.json({
      data: reminders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
}

// POST /api/reminders - Create new reminder
const createReminderSchema = z.object({
  datetime: z.string(),
  taskId: z.string().min(1, 'Task ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createReminderSchema.parse(body);

    const reminder = await prisma.reminder.create({
      data: {
        datetime: new Date(validatedData.datetime),
        taskId: validatedData.taskId,
      },
    });

    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    console.error('Error creating reminder:', error instanceof Error ? error.message : 'Unknown error');
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create reminder' },
      { status: 500 }
    );
  }
}
