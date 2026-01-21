import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createUser, createList } from '@/lib/db-utils';
import prisma from '@/lib/prisma';

describe('Minimal Test', () => {
  let testUserId: string;

  beforeEach(async () => {
    // Cleanup the entire database before each test
    await prisma.taskHistory.deleteMany({});
    await prisma.attachment.deleteMany({});
    await prisma.reminder.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.label.deleteMany({});
    await prisma.list.deleteMany({});
    await prisma.user.deleteMany({});

    // Create a test user first with unique email
    const testEmail = `test-minimal-${Date.now()}@example.com`;
    const testUser = await createUser({
      email: testEmail,
      name: 'Test Minimal User',
    });
    testUserId = testUser.id;
    console.log('Created user:', testUserId);
  });

  afterEach(async () => {
    // Cleanup the entire database after each test
    await prisma.taskHistory.deleteMany({});
    await prisma.attachment.deleteMany({});
    await prisma.reminder.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.label.deleteMany({});
    await prisma.list.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('should create a user and list without foreign key errors', async () => {
    // Try creating a list
    const testList = await createList({
      name: 'Test List',
      emoji: '📝',
      color: '#000000',
      isDefault: false,
      isFavorite: false,
      userId: testUserId,
    });
    
    expect(testList).not.toBeNull();
    expect(testList.userId).toBe(testUserId);
    expect(testList.name).toBe('Test List');
    
    console.log('Created list:', testList.id);
  });
});
