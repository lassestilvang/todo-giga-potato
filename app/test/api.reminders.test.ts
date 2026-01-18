import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import prisma from '@/lib/prisma';
import { deleteList } from '@/lib/db-utils';

const API_BASE_URL = 'http://localhost:32754/api';
const DEFAULT_USER_ID = 'cmki1ekso0000i4ezi4fhaecm';

describe('Reminders API', () => {
  let testListId: string;
  let testTaskId: string;

  // Create a test task before each test
  beforeEach(async () => {
    // Create a test list to associate with tasks
    const testList = await prisma.list.create({
      data: {
        name: 'Test List for Reminders',
        emoji: '📝',
        color: '#000000',
        isDefault: false,
        isFavorite: false,
        userId: DEFAULT_USER_ID,
      },
    });
    testListId = testList.id;

    const testTask = await prisma.task.create({
      data: {
        name: 'Test Task for Reminders',
        description: 'This is a test task for reminders API',
        listId: testListId,
        userId: DEFAULT_USER_ID,
      },
    });
    testTaskId = testTask.id;
  });

  // Delete the test task after each test
  afterEach(async () => {
    await prisma.reminder.deleteMany({
      where: { taskId: testTaskId },
    });
    await prisma.task.deleteMany({
      where: { id: testTaskId },
    });
    try {
      await deleteList(testListId);
    } catch (error) {
      console.error('Error deleting test list:', error);
    }
  });

  describe('POST /api/reminders', () => {
    it('should create a new reminder with valid data', async () => {
      const response = await fetch(`${API_BASE_URL}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datetime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          taskId: testTaskId,
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.id).toBeDefined();
      expect(data.taskId).toBe(testTaskId);
      expect(new Date(data.datetime)).toBeInstanceOf(Date);
    });

    it('should return 400 error with invalid data', async () => {
      const response = await fetch(`${API_BASE_URL}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing required fields
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.details).toBeDefined();
    });
  });

  describe('GET /api/reminders', () => {
    it('should return all reminders', async () => {
      // Create multiple reminders
      const reminder1 = await prisma.reminder.create({
        data: {
          datetime: new Date(Date.now() + 86400000),
          taskId: testTaskId,
        },
      });
      const reminder2 = await prisma.reminder.create({
        data: {
          datetime: new Date(Date.now() + 172800000),
          taskId: testTaskId,
        },
      });

      const response = await fetch(`${API_BASE_URL}/reminders`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toBeInstanceOf(Array);
      expect(data.pagination).toBeDefined();

      // Check if both reminders are in the response
      const reminderIds = data.data.map((r: any) => r.id);
      expect(reminderIds).toContain(reminder1.id);
      expect(reminderIds).toContain(reminder2.id);
    });

    it('should return reminders for specific task', async () => {
      // Create a reminder for test task
      const testReminder = await prisma.reminder.create({
        data: {
          datetime: new Date(Date.now() + 86400000),
          taskId: testTaskId,
        },
      });

      // Create another reminder for a different task (using the same test list)
      const otherTask = await prisma.task.create({
        data: {
          name: 'Other Test Task',
          listId: testListId,
          userId: DEFAULT_USER_ID,
        },
      });
      await prisma.reminder.create({
        data: {
          datetime: new Date(Date.now() + 172800000),
          taskId: otherTask.id,
        },
      });

      const response = await fetch(`${API_BASE_URL}/reminders?taskId=${testTaskId}`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toBeInstanceOf(Array);
      expect(data.pagination).toBeDefined();

      // Should only have the test reminder
      expect(data.data.length).toBeGreaterThan(0);
      const allTaskIds = data.data.map((r: any) => r.taskId);
      allTaskIds.forEach(id => expect(id).toBe(testTaskId));
      const allReminderIds = data.data.map((r: any) => r.id);
      expect(allReminderIds).toContain(testReminder.id);

      // Cleanup
      await prisma.reminder.deleteMany({
        where: { taskId: otherTask.id },
      });
      await prisma.task.delete({
        where: { id: otherTask.id },
      });
    });

    it('should return paginated reminders', async () => {
      // Create multiple reminders to test pagination
      const reminders = [];
      for (let i = 0; i < 15; i++) {
        reminders.push(
          prisma.reminder.create({
            data: {
              datetime: new Date(Date.now() + i * 86400000),
              taskId: testTaskId,
            },
          })
        );
      }
      await Promise.all(reminders);

      const response = await fetch(`${API_BASE_URL}/reminders?page=2&limit=5`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toBeInstanceOf(Array);
      expect(data.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 15,
        pages: 3,
      });
      expect(data.data.length).toBe(5);
    });
  });

  describe('GET /api/reminders/[id]', () => {
    it('should return a specific reminder by ID', async () => {
      const testReminder = await prisma.reminder.create({
        data: {
          datetime: new Date(Date.now() + 86400000),
          taskId: testTaskId,
        },
      });

      const response = await fetch(`${API_BASE_URL}/reminders/${testReminder.id}`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(expect.objectContaining({
        id: testReminder.id,
        datetime: testReminder.datetime.toISOString(),
        taskId: testTaskId,
      }));
    });

    it('should return 404 for non-existent reminder', async () => {
      const response = await fetch(`${API_BASE_URL}/reminders/non-existent-id`);
      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/reminders/[id]', () => {
    it('should update a reminder with valid data', async () => {
      const testReminder = await prisma.reminder.create({
        data: {
          datetime: new Date(Date.now() + 86400000),
          taskId: testTaskId,
        },
      });

      const newDatetime = new Date(Date.now() + 172800000).toISOString();
      const response = await fetch(`${API_BASE_URL}/reminders/${testReminder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datetime: newDatetime }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toEqual(testReminder.id);
      expect(data.datetime).toEqual(new Date(newDatetime).toISOString());
    });

    it('should return 404 for non-existent reminder', async () => {
      const response = await fetch(`${API_BASE_URL}/reminders/non-existent-id`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datetime: new Date().toISOString() }),
      });
      expect(response.status).toBe(404);
    });

    it('should return 400 with invalid data', async () => {
      const testReminder = await prisma.reminder.create({
        data: {
          datetime: new Date(Date.now() + 86400000),
          taskId: testTaskId,
        },
      });

      const response = await fetch(`${API_BASE_URL}/reminders/${testReminder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datetime: 'invalid-date' }),
      });
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/reminders/[id]', () => {
    it('should delete a reminder by ID', async () => {
      const testReminder = await prisma.reminder.create({
        data: {
          datetime: new Date(Date.now() + 86400000),
          taskId: testTaskId,
        },
      });

      const response = await fetch(`${API_BASE_URL}/reminders/${testReminder.id}`, {
        method: 'DELETE',
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe('Reminder deleted successfully');

      // Verify the reminder was deleted
      const deletedReminder = await prisma.reminder.findUnique({
        where: { id: testReminder.id },
      });
      expect(deletedReminder).toBeNull();
    });

    it('should return 404 for non-existent reminder', async () => {
      const response = await fetch(`${API_BASE_URL}/reminders/non-existent-id`, {
        method: 'DELETE',
      });
      expect(response.status).toBe(404);
    });
  });
});
