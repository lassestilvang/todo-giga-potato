import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import prisma from '@/lib/prisma';
import { createUser } from '@/lib/db-utils';

const API_BASE_URL = 'http://localhost:32754/api';
let DEFAULT_USER_ID: string;

describe('Search API', () => {
  let testListId: string;
  let testLabelId: string;
  let testTask1Id: string;
  let testTask2Id: string;

  beforeEach(async () => {
    // Create a test user first with unique email
    const testEmail = `test-search-${Date.now()}@example.com`;
    const testUser = await createUser({
      email: testEmail,
      name: 'Test Search User',
    });
    DEFAULT_USER_ID = testUser.id;

    // Create a test list
    const testList = await prisma.list.create({
      data: {
        name: 'Test List',
        emoji: '📝',
        color: '#000000',
        isDefault: false,
        isFavorite: false,
        userId: DEFAULT_USER_ID,
      },
    });
    testListId = testList.id;

    // Create a test label
    const testLabel = await prisma.label.create({
      data: {
        name: 'Test Label',
        color: '#ff0000',
        userId: DEFAULT_USER_ID,
      },
    });
    testLabelId = testLabel.id;

    // Create test tasks for search
    const task1 = await prisma.task.create({
      data: {
        name: 'Important Task',
        description: 'This is an important test task with high priority',
        listId: testListId,
        userId: DEFAULT_USER_ID,
        priority: 3,
        labels: { connect: [{ id: testLabelId }] },
      },
    });
    testTask1Id = task1.id;

    const task2 = await prisma.task.create({
      data: {
        name: 'Regular Task',
        description: 'This is a regular test task',
        listId: testListId,
        userId: DEFAULT_USER_ID,
        priority: 1,
      },
    });
    testTask2Id = task2.id;
  });

  afterEach(async () => {
    // Manually delete all associated data to avoid foreign key constraints
    const userTasks = await prisma.task.findMany({
      where: { userId: DEFAULT_USER_ID },
      select: { id: true },
    });
    const taskIds = userTasks.map(task => task.id);
    
    await prisma.taskHistory.deleteMany({ where: { taskId: { in: taskIds } } });
    await prisma.attachment.deleteMany({ where: { taskId: { in: taskIds } } });
    await prisma.reminder.deleteMany({ where: { taskId: { in: taskIds } } });
    await prisma.task.deleteMany({ where: { userId: DEFAULT_USER_ID } });
    await prisma.label.deleteMany({ where: { userId: DEFAULT_USER_ID } });
    await prisma.list.deleteMany({ where: { userId: DEFAULT_USER_ID } });
    await prisma.user.deleteMany({ where: { id: DEFAULT_USER_ID } });
  });

  describe('GET /api/search', () => {
    it('should search tasks with query parameter', async () => {
      const response = await fetch(`${API_BASE_URL}/search?q=Test`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual(expect.objectContaining({
        data: expect.any(Array),
        pagination: expect.any(Object),
        query: 'Test',
      }));

      expect(data.data.length).toBeGreaterThan(0);
    });

    it('should search tasks with specific query', async () => {
      const response = await fetch(`${API_BASE_URL}/search?q=Important`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.data).toBeInstanceOf(Array);
      
      const foundTask = data.data.find((task: any) => task.id === testTask1Id);
      expect(foundTask).toBeDefined();
    });

    it('should return 400 error without query parameter', async () => {
      const response = await fetch(`${API_BASE_URL}/search`);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toEqual(expect.objectContaining({
        error: 'Validation error',
        details: expect.any(Array),
      }));
    });

    it('should search with list filter', async () => {
      const response = await fetch(`${API_BASE_URL}/search?q=Test&listId=${testListId}`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.data).toBeInstanceOf(Array);
      data.data.forEach((task: any) => {
        expect(task.listId).toBe(testListId);
      });
    });

    it('should search with priority filter', async () => {
      const response = await fetch(`${API_BASE_URL}/search?q=Test&priority=3`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.data).toBeInstanceOf(Array);
      data.data.forEach((task: any) => {
        expect(task.priority).toBe(3);
      });
    });

    it('should search with completed filter', async () => {
      // Mark task1 as completed
      await prisma.task.update({
        where: { id: testTask1Id },
        data: { completedAt: new Date() },
      });

      const response = await fetch(`${API_BASE_URL}/search?q=Test&completed=true`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.data).toBeInstanceOf(Array);
      data.data.forEach((task: any) => {
        expect(task.completedAt).not.toBeNull();
      });
    });

    it('should return paginated search results', async () => {
      const response = await fetch(`${API_BASE_URL}/search?q=Test&page=1&limit=1`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(1);
      expect(data.data.length).toBeLessThanOrEqual(1);
    });

    it('should return tasks with search scores', async () => {
      const response = await fetch(`${API_BASE_URL}/search?q=Test`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      data.data.forEach((task: any) => {
        expect(typeof task.score).toBe('number');
        expect(task.score).toBeGreaterThanOrEqual(0);
      });
    });

    it('should sort results by score descending', async () => {
      // Create a task with exact match
      const exactMatchTask = await prisma.task.create({
        data: {
          name: 'Test Task Exact',
          description: 'Exact match test task',
          listId: testListId,
          userId: DEFAULT_USER_ID,
          priority: 2,
        },
      });

      const response = await fetch(`${API_BASE_URL}/search?q=Test`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      // Highest score should be first
      const highestScore = data.data[0].score;
      data.data.forEach((task: any) => {
        expect(task.score).toBeLessThanOrEqual(highestScore);
      });

      // Cleanup
      await prisma.task.delete({ where: { id: exactMatchTask.id } });
    });
  });
});
