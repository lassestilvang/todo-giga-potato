import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// GET /api/tasks - Get all tasks with filters and pagination
const getTasksQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  listId: z.string().optional(),
  completed: z.string().optional().transform(val => val ? val === 'true' : undefined),
  priority: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  search: z.string().optional(),
  date: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = getTasksQuerySchema.parse(Object.fromEntries(searchParams.entries()));

    const { page, limit, listId, completed, priority, search, date } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (listId) where.listId = listId;
    if (completed !== undefined) {
      if (completed) {
        where.completedAt = { not: null };
      } else {
        where.completedAt = null;
      }
    }
    if (priority !== undefined) where.priority = priority;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      where.date = {
        gte: targetDate,
        lt: nextDay,
      };
    }

    // Add default user filter (TODO: Replace with actual user authentication)
    where.userId = '1';
    
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        include: {
          list: true,
          labels: true,
          subtasks: true,
          attachments: true,
          reminders: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.task.count({ where }),
    ]);

    return NextResponse.json({
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create new task
const createTaskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  description: z.string().optional(),
  date: z.string().optional(),
  deadline: z.string().optional(),
  estimates: z.number().optional(),
  actualTime: z.number().optional(),
  priority: z.number().default(0),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.string().optional(),
  listId: z.string().min(1, 'List ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  labels: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);

    const { labels, ...taskData } = validatedData;

    const task = await prisma.task.create({
      data: {
        ...taskData,
        ...(taskData.date ? { date: new Date(taskData.date) } : {}),
        ...(taskData.deadline ? { deadline: new Date(taskData.deadline) } : {}),
        labels: labels ? {
          connect: labels.map((labelId: string) => ({ id: labelId })),
        } : undefined,
      },
      include: {
        list: true,
        labels: true,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
