import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import prisma from '@/lib/prisma';
import { createUser } from '@/lib/db-utils';

const API_BASE_URL = 'http://localhost:32754/api';
let DEFAULT_USER_ID: string;

describe('Lists API', () => {
  let testListId: string;

  beforeEach(async () => {
    // Create a test user first with unique email
    const testEmail = `test-lists-${Date.now()}@example.com`;
    const testUser = await createUser({
      email: testEmail,
      name: 'Test Lists User',
    });
    DEFAULT_USER_ID = testUser.id;

    // Create a test list for update/delete tests
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

  describe('GET /api/lists', () => {
    it('should return all lists for the default user', async () => {
      const response = await fetch(`${API_BASE_URL}/lists`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toBeInstanceOf(Array);
      data.forEach((list: any) => {
        expect(list.userId).toBe(DEFAULT_USER_ID);
        expect(typeof list.name).toBe('string');
      });
    });

    it('should return lists for specific user', async () => {
      const response = await fetch(`${API_BASE_URL}/lists?userId=${DEFAULT_USER_ID}`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toBeInstanceOf(Array);
      data.forEach((list: any) => {
        expect(list.userId).toBe(DEFAULT_USER_ID);
      });
    });
  });

  describe('POST /api/lists', () => {
    it('should create a new list with valid data', async () => {
      const newList = {
        name: 'New List',
        emoji: '📚',
        color: '#00ff00',
        isDefault: false,
        isFavorite: true,
        userId: DEFAULT_USER_ID,
      };

      const response = await fetch(`${API_BASE_URL}/lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newList),
      });

      expect(response.status).toBe(201);
      
      const list = await response.json();
      expect(list).toEqual(expect.objectContaining({
        id: expect.any(String),
        name: newList.name,
        emoji: newList.emoji,
        color: newList.color,
        isDefault: newList.isDefault,
        isFavorite: newList.isFavorite,
        userId: newList.userId,
      }));
    });

    it('should create a default list and update existing default', async () => {
      // Create a new default list
      const newDefaultList = {
        name: 'New Default List',
        emoji: '🏠',
        color: '#0000ff',
        isDefault: true,
        isFavorite: true,
        userId: DEFAULT_USER_ID,
      };

      const response = await fetch(`${API_BASE_URL}/lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDefaultList),
      });

      expect(response.status).toBe(201);
      
      const list = await response.json();
      expect(list.isDefault).toBe(true);

      // Verify only new list is default
      const allLists = await prisma.list.findMany({
        where: { userId: DEFAULT_USER_ID },
      });
      const defaultLists = allLists.filter((l) => l.isDefault);
      expect(defaultLists.length).toBe(1);
      expect(defaultLists[0].id).toBe(list.id);
    });

    it('should return 400 error with invalid data', async () => {
      const invalidList = {
        // Missing required fields
        emoji: '📚',
        color: '#00ff00',
        isDefault: false,
        isFavorite: true,
        userId: DEFAULT_USER_ID,
      };

      const response = await fetch(`${API_BASE_URL}/lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidList),
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toEqual(expect.objectContaining({
        error: 'Validation error',
        details: expect.any(Array),
      }));
    });
  });

  describe('GET /api/lists/[id]', () => {
    it('should return a specific list by ID', async () => {
      const response = await fetch(`${API_BASE_URL}/lists/${testListId}`);
      expect(response.status).toBe(200);
      
      const list = await response.json();
      expect(list).toEqual(expect.objectContaining({
        id: testListId,
        name: 'Test List',
      }));
    });

    it('should return 404 for non-existent list', async () => {
      const nonExistentId = 'non-existent-id';
      const response = await fetch(`${API_BASE_URL}/lists/${nonExistentId}`);
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data).toEqual(expect.objectContaining({
        error: 'List not found',
      }));
    });
  });

  describe('PUT /api/lists/[id]', () => {
    it('should update a list with valid data', async () => {
      const updates = {
        name: 'Updated Test List',
        emoji: '📖',
        color: '#0000ff',
        isDefault: true,
        isFavorite: true,
      };

      const response = await fetch(`${API_BASE_URL}/lists/${testListId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      expect(response.status).toBe(200);
      
      const list = await response.json();
      expect(list).toEqual(expect.objectContaining({
        id: testListId,
        name: updates.name,
        emoji: updates.emoji,
        color: updates.color,
        isDefault: updates.isDefault,
        isFavorite: updates.isFavorite,
      }));
    });

    it('should return 404 for non-existent list', async () => {
      const nonExistentId = 'non-existent-id';
      const response = await fetch(`${API_BASE_URL}/lists/${nonExistentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Updated List' }),
      });

      expect(response.status).toBe(404);
    });

    it('should return 400 with invalid data', async () => {
      const response = await fetch(`${API_BASE_URL}/lists/${testListId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: '' }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/lists/[id]', () => {
    it('should delete a list by ID', async () => {
      const response = await fetch(`${API_BASE_URL}/lists/${testListId}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual(expect.objectContaining({
        message: 'List deleted successfully',
      }));

      // Verify list was deleted
      const checkResponse = await fetch(`${API_BASE_URL}/lists/${testListId}`);
      expect(checkResponse.status).toBe(404);
    });

    it('should return 404 for non-existent list', async () => {
      const nonExistentId = 'non-existent-id';
      const response = await fetch(`${API_BASE_URL}/lists/${nonExistentId}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(404);
    });
  });
});
