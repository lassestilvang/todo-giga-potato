import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  getTasksByUserId,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getListsByUserId,
  getListById,
  createList,
  updateList,
  deleteList,
  getLabelsByUserId,
  createLabel,
  updateLabel,
  deleteLabel,
  createUser,
} from '@/lib/db-utils';
import prisma from '@/lib/prisma';

describe('Database Operations', () => {
  let testUserId: string;
  let testListId: string;
  let testLabelId: string;
  let testTaskId: string;

  // Create test data before each test
  beforeEach(async () => {
    // Create a test user first with unique email
    const testEmail = `test-${Date.now()}@example.com`;
    const testUser = await createUser({
      email: testEmail,
      name: 'Test User',
    });
    testUserId = testUser.id;

    // Create a test list
    const testList = await prisma.list.create({
      data: {
        name: 'Test List',
        emoji: '📝',
        color: '#000000',
        isDefault: false,
        isFavorite: false,
        userId: testUserId,
      },
    });
    testListId = testList.id;

    // Create a test label
    const testLabel = await prisma.label.create({
      data: {
        name: 'Test Label',
        color: '#ff0000',
        userId: testUserId,
      },
    });
    testLabelId = testLabel.id;

    // Create a test task
    const testTask = await prisma.task.create({
      data: {
        name: 'Test Task',
        description: 'This is a test task',
        listId: testListId,
        userId: testUserId,
        priority: 1,
      },
    });
    testTaskId = testTask.id;
  });

  // Cleanup test data after each test
  afterEach(async () => {
    // Manually delete all associated data to avoid foreign key constraints
    // Get all tasks associated with the user
    const userTasks = await prisma.task.findMany({
      where: { userId: testUserId },
      select: { id: true },
    });
    const taskIds = userTasks.map(task => task.id);
    
    // Delete task history
    await prisma.taskHistory.deleteMany({
      where: { taskId: { in: taskIds } },
    });
    
    // Delete attachments
    await prisma.attachment.deleteMany({
      where: { taskId: { in: taskIds } },
    });
    
    // Delete reminders
    await prisma.reminder.deleteMany({
      where: { taskId: { in: taskIds } },
    });
    
    // Delete tasks
    await prisma.task.deleteMany({
      where: { userId: testUserId },
    });
    
    // Delete labels
    await prisma.label.deleteMany({
      where: { userId: testUserId },
    });
    
    // Delete lists
    await prisma.list.deleteMany({
      where: { userId: testUserId },
    });
    
    // Delete user
    await prisma.user.deleteMany({
      where: { id: testUserId },
    });
  });

  describe('List Operations', () => {
    it('should get all lists for a user', async () => {
      const lists = await getListsByUserId(testUserId);
      expect(lists).toBeInstanceOf(Array);
      expect(lists.length).toBeGreaterThan(0);
      lists.forEach((list) => {
        expect(list.userId).toBe(testUserId);
        expect(typeof list.name).toBe('string');
      });
    });

    it('should get a specific list by ID', async () => {
      const list = await getListById(testListId);
      expect(list).not.toBeNull();
      expect(list?.id).toBe(testListId);
      expect(list?.name).toBe('Test List');
    });

    it('should create a new list', async () => {
      const newList = await createList({
        name: 'New Test List',
        emoji: '📚',
        color: '#00ff00',
        isDefault: false,
        isFavorite: true,
        userId: testUserId,
      });
      expect(newList).not.toBeNull();
      expect(newList.name).toBe('New Test List');
      expect(newList.emoji).toBe('📚');
      expect(newList.color).toBe('#00ff00');
      expect(newList.isDefault).toBe(false);
      expect(newList.isFavorite).toBe(true);
      expect(newList.userId).toBe(testUserId);
    });

    it('should update a list', async () => {
      const updatedList = await updateList(testListId, {
        name: 'Updated Test List',
        emoji: '📖',
        color: '#0000ff',
        isDefault: true,
        isFavorite: true,
      });
      expect(updatedList).not.toBeNull();
      expect(updatedList.id).toBe(testListId);
      expect(updatedList.name).toBe('Updated Test List');
      expect(updatedList.emoji).toBe('📖');
      expect(updatedList.color).toBe('#0000ff');
      expect(updatedList.isDefault).toBe(true);
      expect(updatedList.isFavorite).toBe(true);
    });

    it('should delete a list', async () => {
      const result = await deleteList(testListId);
      expect(result).not.toBeNull();
      expect(result.id).toBe(testListId);
      const deletedList = await getListById(testListId);
      expect(deletedList).toBeNull();
    });
  });

  describe('Label Operations', () => {
    it('should get all labels for a user', async () => {
      const labels = await getLabelsByUserId(testUserId);
      expect(labels).toBeInstanceOf(Array);
      expect(labels.length).toBeGreaterThan(0);
      labels.forEach((label) => {
        expect(label.userId).toBe(testUserId);
        expect(typeof label.name).toBe('string');
        expect(typeof label.color).toBe('string');
      });
    });

    it('should create a new label', async () => {
      const newLabel = await createLabel({
        name: 'New Test Label',
        color: '#ffff00',
        userId: testUserId,
      });
      expect(newLabel).not.toBeNull();
      expect(newLabel.name).toBe('New Test Label');
      expect(newLabel.color).toBe('#ffff00');
      expect(newLabel.userId).toBe(testUserId);
    });

    it('should update a label', async () => {
      const updatedLabel = await updateLabel(testLabelId, {
        name: 'Updated Test Label',
        color: '#00ffff',
      });
      expect(updatedLabel).not.toBeNull();
      expect(updatedLabel.id).toBe(testLabelId);
      expect(updatedLabel.name).toBe('Updated Test Label');
      expect(updatedLabel.color).toBe('#00ffff');
    });

    it('should delete a label', async () => {
      const result = await deleteLabel(testLabelId);
      expect(result).not.toBeNull();
      expect(result.id).toBe(testLabelId);
      const deletedLabel = await prisma.label.findUnique({
        where: { id: testLabelId },
      });
      expect(deletedLabel).toBeNull();
    });
  });

  describe('Task Operations', () => {
    it('should get all tasks for a user', async () => {
      const tasks = await getTasksByUserId(testUserId);
      expect(tasks).toBeInstanceOf(Array);
      expect(tasks.length).toBeGreaterThan(0);
      tasks.forEach((task) => {
        expect(task.userId).toBe(testUserId);
        expect(typeof task.name).toBe('string');
      });
    });

    it('should get a specific task by ID', async () => {
      const task = await getTaskById(testTaskId);
      expect(task).not.toBeNull();
      expect(task?.id).toBe(testTaskId);
      expect(task?.name).toBe('Test Task');
    });

    it('should create a new task', async () => {
      const newTask = await createTask({
        name: 'New Test Task',
        description: 'This is a new test task',
        listId: testListId,
        userId: testUserId,
        priority: 2,
        labels: [testLabelId],
      });
      expect(newTask).not.toBeNull();
      expect(newTask.name).toBe('New Test Task');
      expect(newTask.description).toBe('This is a new test task');
      expect(newTask.listId).toBe(testListId);
      expect(newTask.userId).toBe(testUserId);
      expect(newTask.priority).toBe(2);
      expect(newTask.labels).toBeInstanceOf(Array);
      expect(newTask.labels.length).toBeGreaterThan(0);
    });

    it('should update a task', async () => {
      const updatedTask = await updateTask(testTaskId, {
        name: 'Updated Test Task',
        description: 'This is an updated test task',
        priority: 3,
        labels: [testLabelId],
      });
      expect(updatedTask).not.toBeNull();
      expect(updatedTask.id).toBe(testTaskId);
      expect(updatedTask.name).toBe('Updated Test Task');
      expect(updatedTask.description).toBe('This is an updated test task');
      expect(updatedTask.priority).toBe(3);
    });

    it('should delete a task', async () => {
      const result = await deleteTask(testTaskId);
      expect(result).not.toBeNull();
      expect(result.id).toBe(testTaskId);
      const deletedTask = await getTaskById(testTaskId);
      expect(deletedTask).toBeNull();
    });
  });
});
