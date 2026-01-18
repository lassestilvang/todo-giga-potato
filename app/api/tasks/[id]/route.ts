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

// Recurring pattern schema for API validation (update)
const apiUpdateRecurringPatternSchema = z.object({
  type: z.enum(["daily", "weekly", "weekday", "monthly", "yearly", "custom"]).optional(),
  interval: z.number().min(1).optional(),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  month: z.number().min(1).max(12).optional(),
  endDate: z.string().optional(),
})

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
  recurringPattern: z.union([
    z.string(),
    apiUpdateRecurringPatternSchema,
  ]).optional(),
  completedAt: z.string().optional(),
  listId: z.string().optional(),
  order: z.number().optional(),
  labels: z.array(z.string()).optional(),
  subtasks: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    completedAt: z.string().optional(),
  })).optional(),
  reminders: z.array(z.string()).optional(),
}).refine(data => {
  if (data.isRecurring === true && !data.recurringPattern) {
    return false
  }
  return true
}, {
  message: "Recurring pattern is required for recurring tasks",
  path: ["recurringPattern"],
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    // Parse and validate recurring pattern if provided
    let parsedRecurringPattern = validatedData.recurringPattern
    if (validatedData.isRecurring === true || validatedData.recurringPattern) {
      if (typeof validatedData.recurringPattern === "string") {
        try {
          parsedRecurringPattern = JSON.parse(validatedData.recurringPattern)
        } catch (e) {
          // If JSON parsing fails, treat as legacy string format or default to custom
          const allowedTypes = ["daily", "weekly", "weekday", "monthly", "yearly", "custom"]
          const isAllowedType = allowedTypes.includes(validatedData.recurringPattern.toLowerCase())
          
          parsedRecurringPattern = {
            type: isAllowedType ? (validatedData.recurringPattern.toLowerCase() as "daily" | "weekly" | "weekday" | "monthly" | "yearly" | "custom") : "custom",
            interval: 1,
          }
        }
      }
      
      // Validate parsed recurring pattern if it exists
      if (parsedRecurringPattern) {
        apiUpdateRecurringPatternSchema.parse(parsedRecurringPattern)
      }
    }

    // Get old task data for comparison
    const oldTask = await prisma.task.findUnique({
      where: { id },
      include: {
        labels: true,
        subtasks: true,
        reminders: true,
        attachments: true,
      },
    });

    if (!oldTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const { labels, subtasks, recurringPattern, listId, reminders, ...taskData } = validatedData;

    // If subtasks are provided, update them
    if (subtasks) {
      // First, get existing subtasks and current task info
      const existingTask = await prisma.task.findUnique({
        where: { id },
        select: { 
          subtasks: { select: { id: true } },
          userId: true,
          listId: true
        },
      });

      if (!existingTask) {
        throw new Error('Task not found');
      }

      // Delete subtasks not in the new list
      const existingSubtaskIds = existingTask.subtasks.map((s) => s.id);
      const newSubtaskIds = subtasks.filter((s: any) => s.id).map((s: any) => s.id);
      const subtasksToDelete = existingSubtaskIds.filter((subtaskId) => !newSubtaskIds.includes(subtaskId));
      
      if (subtasksToDelete.length > 0) {
        await prisma.task.deleteMany({
          where: { id: { in: subtasksToDelete } },
        });
      }

      // Update existing subtasks and create new ones
      const subtaskOperations = subtasks.map((subtask: any) => {
        if (subtask.id) {
          // Update existing subtask
          return prisma.task.update({
            where: { id: subtask.id },
            data: {
              name: subtask.name,
              completedAt: subtask.completedAt ? new Date(subtask.completedAt) : null,
            },
          });
        } else {
          // Create new subtask using existing task info
          return prisma.task.create({
            data: {
              name: subtask.name,
              userId: existingTask.userId,
              listId: existingTask.listId,
              parentId: id,
              completedAt: subtask.completedAt ? new Date(subtask.completedAt) : null,
            },
          });
        }
      });

      await Promise.all(subtaskOperations);
    }

    // Handle reminders if provided
    if (validatedData.reminders !== undefined) {
      // Delete existing reminders
      await prisma.reminder.deleteMany({
        where: { taskId: id },
      });
      
      // Create new reminders if provided
      if (validatedData.reminders && validatedData.reminders.length > 0) {
        await prisma.reminder.createMany({
          data: validatedData.reminders.map((datetime: string) => ({
            datetime: new Date(datetime),
            taskId: id,
          })),
        });
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...taskData,
        ...(parsedRecurringPattern !== undefined ? { recurringPattern: JSON.stringify(parsedRecurringPattern) } : {}),
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
        subtasks: true,
        attachments: true,
        reminders: true,
      },
    });

    // Create task history entry
    await prisma.taskHistory.create({
      data: {
        taskId: task.id,
        action: 'updated',
        oldValue: JSON.stringify(oldTask),
        newValue: JSON.stringify(task),
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

    return NextResponse.json(taskWithHistory);
  } catch (error) {
    console.error('Error updating task:', error instanceof Error ? error.message : 'Unknown error');
    
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
    
    // Handle Prisma errors
    const prismaError = error as any;
    if (prismaError.code === 'P2025') { // Record not found
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
