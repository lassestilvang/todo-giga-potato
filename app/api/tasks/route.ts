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
    where.userId = 'cmki1ekso0000i4ezi4fhaecm';
    
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
          history: true,
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

// Recurring pattern schema for API validation
const apiRecurringPatternSchema = z.object({
  type: z.enum(["daily", "weekly", "weekday", "monthly", "yearly", "custom"]),
  interval: z.number().min(1).default(1),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  month: z.number().min(1).max(12).optional(),
  endDate: z.string().optional(),
})

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
  recurringPattern: z.union([
    z.string(),
    apiRecurringPatternSchema,
  ]).optional(),
  listId: z.string().min(1, 'List ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  labels: z.array(z.string()).optional(),
  subtasks: z.array(z.object({
    name: z.string().min(1),
  })).optional(),
  reminders: z.array(z.string()).optional(),
}).refine(data => {
  if (data.isRecurring && !data.recurringPattern) {
    return false
  }
  return true
}, {
  message: "Recurring pattern is required for recurring tasks",
  path: ["recurringPattern"],
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);

    // Parse and validate recurring pattern
    let parsedRecurringPattern = validatedData.recurringPattern
    if (validatedData.isRecurring) {
      if (typeof validatedData.recurringPattern === "string") {
        try {
          parsedRecurringPattern = JSON.parse(validatedData.recurringPattern)
        } catch (e) {
          // If JSON parsing fails, treat as legacy string format
          const allowedTypes = ["daily", "weekly", "weekday", "monthly", "yearly", "custom"]
          const isAllowedType = allowedTypes.includes(validatedData.recurringPattern.toLowerCase())
          
          parsedRecurringPattern = {
            type: isAllowedType ? (validatedData.recurringPattern.toLowerCase() as "daily" | "weekly" | "weekday" | "monthly" | "yearly" | "custom") : "custom",
            interval: 1,
          }
        }
      }
      
      // Validate parsed recurring pattern
      apiRecurringPatternSchema.parse(parsedRecurringPattern)
    }

    const { labels, subtasks, reminders, recurringPattern, ...taskData } = validatedData;

    const task = await prisma.task.create({
      data: {
        ...taskData,
        recurringPattern: JSON.stringify(parsedRecurringPattern),
        ...(taskData.date ? { date: new Date(taskData.date) } : {}),
        ...(taskData.deadline ? { deadline: new Date(taskData.deadline) } : {}),
        labels: labels ? {
          connect: labels.map((labelId: string) => ({ id: labelId })),
        } : undefined,
        subtasks: subtasks ? {
          create: subtasks.map((subtask: any) => ({
            name: subtask.name,
            userId: taskData.userId,
            listId: taskData.listId,
          })),
        } : undefined,
        reminders: reminders ? {
          create: reminders.map((datetime: string) => ({
            datetime: new Date(datetime),
          })),
        } : undefined,
      },
      include: {
        list: true,
        labels: true,
        subtasks: true,
        attachments: true,
        reminders: true,
      },
    });

    // Create task history entry for task creation
    await prisma.taskHistory.create({
      data: {
        taskId: task.id,
        action: 'created',
        changedBy: task.userId,
      },
    });

    // Include history in response
    const taskWithHistory = await prisma.task.findUnique({
      where: { id: task.id },
      include: {
        list: true,
        labels: true,
        subtasks: true,
        attachments: true,
        reminders: true,
        history: true,
      },
    });

    return NextResponse.json(taskWithHistory, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error instanceof Error ? error.message : 'Unknown error');
    
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
