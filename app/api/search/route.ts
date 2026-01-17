import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// GET /api/search - Search tasks with fuzzy search
const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  listId: z.string().optional(),
  completed: z.string().optional().transform(val => val ? val === 'true' : undefined),
  priority: z.string().optional().transform(val => val ? parseInt(val) : undefined),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchQuerySchema.parse(Object.fromEntries(searchParams.entries()));

    const { q, page, limit, listId, completed, priority } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      OR: [
        { name: { contains: q } },
        { description: { contains: q } },
      ],
    };

    if (listId) where.listId = listId;
    if (completed !== undefined) {
      if (completed) {
        where.completedAt = { not: null };
      } else {
        where.completedAt = null;
      }
    }
    if (priority !== undefined) where.priority = priority;

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
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.task.count({ where }),
    ]);

    // Calculate search relevance score for each task (simple matching score)
    const tasksWithScore = tasks.map(task => {
      let score = 0;
      
      // Exact match in name
      if (task.name.toLowerCase() === q.toLowerCase()) {
        score += 100;
      } else if (task.name.toLowerCase().includes(q.toLowerCase())) {
        score += 50;
      }
      
      // Match in description
      if (task.description && task.description.toLowerCase().includes(q.toLowerCase())) {
        score += 30;
      }
      
      // Match in labels
      if (task.labels.length > 0) {
        task.labels.forEach(label => {
          if (label.name.toLowerCase().includes(q.toLowerCase())) {
            score += 20;
          }
        });
      }
      
      return {
        ...task,
        score,
      };
    });

    // Sort by score descending
    tasksWithScore.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      data: tasksWithScore,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      query: q,
    });
  } catch (error) {
    console.error('Error searching tasks:', error.message);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to search tasks' },
      { status: 500 }
    );
  }
}
