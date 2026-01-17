import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import prisma from '@/lib/prisma';
import { deleteList } from '@/lib/db-utils';

const API_BASE_URL = 'http://localhost:32754/api';
const DEFAULT_USER_ID = 'cmki1ekso0000i4ezi4fhaecm';

describe('Tasks API', () => {
  let testListId: string;
  let testTaskId: string;

  beforeEach(async () => {
    // Create a test list to associate with tasks
    const testList = await prisma.list.create({
      data: {
        name: 'Test List for Tasks',
        emoji: '📝',
        color: '#000000',
        isDefault: false,
        isFavorite: false,
        userId: DEFAULT_USER_ID,
      },
    });
    testListId = testList.id;

    // Create a test task for update/delete tests
    const testTask = await prisma.task.create({
      data: {
        name: 'Test Task',
        description: 'This is a test task',
        listId: testListId,
        userId: DEFAULT_USER_ID,
        priority: 1,
      },
    });
    testTaskId = testTask.id;
  });

  afterEach(async () => {
    // Cleanup test data
    await prisma.task.deleteMany({
      where: { id: testTaskId },
    });

    // Use deleteList function which handles task deletion properly
    try {
      await deleteList(testListId);
    } catch (error) {
      console.error('Error deleting test list:', error);
    }
  });

  describe('GET /api/tasks', () => {
    it('should return all tasks with pagination', async () => {
      const response = await fetch(`${API_BASE_URL}/tasks`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual(expect.objectContaining({
        data: expect.any(Array),
        pagination: expect.any(Object),
      }));

      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
      expect(typeof data.pagination.total).toBe('number');
      expect(typeof data.pagination.pages).toBe('number');
    });

    it('should return filtered tasks by list ID', async () => {
      const response = await fetch(`${API_BASE_URL}/tasks?listId=${testListId}`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.data).toBeInstanceOf(Array);
      data.data.forEach((task: any) => {
        expect(task.listId).toBe(testListId);
      });
    });

    it('should return filtered tasks by priority', async () => {
      const response = await fetch(`${API_BASE_URL}/tasks?priority=1`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.data).toBeInstanceOf(Array);
      data.data.forEach((task: any) => {
        expect(task.priority).toBe(1);
      });
    });

    it('should return filtered tasks by search term', async () => {
      const response = await fetch(`${API_BASE_URL}/tasks?search=Test`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.data).toBeInstanceOf(Array);
    });

    it('should return paginated results', async () => {
      const response = await fetch(`${API_BASE_URL}/tasks?page=1&limit=2`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(2);
      expect(data.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task with valid data', async () => {
      const newTask = {
        name: 'New Task',
        description: 'This is a new task',
        listId: testListId,
        userId: DEFAULT_USER_ID,
        priority: 2,
        date: new Date().toISOString().split('T')[0],
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        estimates: 30,
      };

      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
      });

      expect(response.status).toBe(201);
      
      const task = await response.json();
      expect(task).toEqual(expect.objectContaining({
        id: expect.any(String),
        name: newTask.name,
        description: newTask.description,
        listId: newTask.listId,
        userId: newTask.userId,
        priority: newTask.priority,
      }));
    });

    it('should return 400 error with invalid data', async () => {
      const invalidTask = {
        // Missing required fields
        description: 'This task has no name',
        listId: testListId,
        userId: DEFAULT_USER_ID,
      };

      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidTask),
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toEqual(expect.objectContaining({
        error: 'Validation error',
        details: expect.any(Array),
      }));
    });
  });

  describe('GET /api/tasks/[id]', () => {
    it('should return a specific task by ID', async () => {
      const response = await fetch(`${API_BASE_URL}/tasks/${testTaskId}`);
      expect(response.status).toBe(200);
      
      const task = await response.json();
      expect(task).toEqual(expect.objectContaining({
        id: testTaskId,
        name: 'Test Task',
        description: 'This is a test task',
      }));
    });

    it('should return 404 for non-existent task', async () => {
      const nonExistentId = 'non-existent-id';
      const response = await fetch(`${API_BASE_URL}/tasks/${nonExistentId}`);
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data).toEqual(expect.objectContaining({
        error: 'Task not found',
      }));
    });
  });

  describe('PUT /api/tasks/[id]', () => {
    it('should update a task with valid data', async () => {
      const updates = {
        name: 'Updated Test Task',
        description: 'This task has been updated',
        priority: 3,
        estimates: 60,
      };

      const response = await fetch(`${API_BASE_URL}/tasks/${testTaskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      expect(response.status).toBe(200);
      
      const task = await response.json();
      expect(task).toEqual(expect.objectContaining({
        id: testTaskId,
        name: updates.name,
        description: updates.description,
        priority: updates.priority,
        estimates: updates.estimates,
      }));
    });

    it('should return 404 for non-existent task', async () => {
      const nonExistentId = 'non-existent-id';
      const response = await fetch(`${API_BASE_URL}/tasks/${nonExistentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Updated Task' }),
      });

      expect(response.status).toBe(404);
    });

    it('should return 400 with invalid data', async () => {
      const response = await fetch(`${API_BASE_URL}/tasks/${testTaskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: '' }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/tasks/[id]', () => {
    it('should delete a task by ID', async () => {
      const response = await fetch(`${API_BASE_URL}/tasks/${testTaskId}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual(expect.objectContaining({
        message: 'Task deleted successfully',
      }));

      // Verify task was deleted
      const checkResponse = await fetch(`${API_BASE_URL}/tasks/${testTaskId}`);
      expect(checkResponse.status).toBe(404);
    });

    it('should return 404 for non-existent task', async () => {
      const nonExistentId = 'non-existent-id';
      const response = await fetch(`${API_BASE_URL}/tasks/${nonExistentId}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(404);
    });
  });
});
