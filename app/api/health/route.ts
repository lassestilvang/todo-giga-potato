import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const users = await prisma.user.findMany({
      take: 1,
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Get count of all tables
    const [usersCount, listsCount, tasksCount, labelsCount] = await Promise.all([
      prisma.user.count(),
      prisma.list.count(),
      prisma.task.count(),
      prisma.label.count(),
    ]);

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        users: usersCount,
        lists: listsCount,
        tasks: tasksCount,
        labels: labelsCount,
      },
      sampleUsers: users,
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
