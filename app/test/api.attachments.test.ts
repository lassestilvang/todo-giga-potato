import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import prisma from '@/lib/prisma';

const API_BASE_URL = 'http://localhost:32754/api';
const DEFAULT_USER_ID = 'cmki1ekso0000i4ezi4fhaecm';

describe('Attachments API', () => {
  let testListId: string;
  let testTaskId: string;
  let testAttachmentId: string;

  beforeEach(async () => {
    // Create a test list
    const testList = await prisma.list.create({
      data: {
        name: 'Test List for Attachments',
        emoji: '📎',
        color: '#000000',
        isDefault: false,
        isFavorite: false,
        userId: DEFAULT_USER_ID,
      },
    });
    testListId = testList.id;

    // Create a test task
    const testTask = await prisma.task.create({
      data: {
        name: 'Task with Attachments',
        description: 'This task has attachments',
        listId: testListId,
        userId: DEFAULT_USER_ID,
        priority: 1,
      },
    });
    testTaskId = testTask.id;

    // Create a test attachment
    const testAttachment = await prisma.attachment.create({
      data: {
        name: 'test-document.pdf',
        url: 'https://example.com/test-document.pdf',
        type: 'application/pdf',
        size: 1024 * 1024, // 1MB
        taskId: testTaskId,
      },
    });
    testAttachmentId = testAttachment.id;
  });

  afterEach(async () => {
    // Cleanup test data
    await prisma.attachment.deleteMany({
      where: { id: testAttachmentId },
    });

    await prisma.task.deleteMany({
      where: { id: testTaskId },
    });

    await prisma.list.deleteMany({
      where: { id: testListId },
    });
  });

  describe('POST /api/attachments', () => {
    it('should create a new attachment with valid data', async () => {
      const newAttachment = {
        name: 'new-document.docx',
        url: 'https://example.com/new-document.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 2 * 1024 * 1024, // 2MB
        taskId: testTaskId,
      };

      const response = await fetch(`${API_BASE_URL}/attachments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAttachment),
      });

      expect(response.status).toBe(201);
      
      const attachment = await response.json();
      expect(attachment).toEqual(expect.objectContaining({
        id: expect.any(String),
        name: newAttachment.name,
        url: newAttachment.url,
        type: newAttachment.type,
        size: newAttachment.size,
        taskId: newAttachment.taskId,
      }));

      // Cleanup the created attachment
      await prisma.attachment.delete({
        where: { id: attachment.id },
      });
    });

    it('should return 400 error with invalid data', async () => {
      const invalidAttachment = {
        // Missing required fields
        url: 'https://example.com/invalid.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 1024,
        taskId: testTaskId,
      };

      const response = await fetch(`${API_BASE_URL}/attachments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidAttachment),
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toEqual(expect.objectContaining({
        error: 'Validation error',
        details: expect.any(Array),
      }));
    });
  });

  describe('DELETE /api/attachments/[id]', () => {
    it('should delete an attachment by ID', async () => {
      const response = await fetch(`${API_BASE_URL}/attachments/${testAttachmentId}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual(expect.objectContaining({
        message: 'Attachment deleted successfully',
      }));

      // Verify attachment was deleted
      const checkResponse = await prisma.attachment.findUnique({
        where: { id: testAttachmentId },
      });
      expect(checkResponse).toBeNull();
    });

    it('should return 404 for non-existent attachment', async () => {
      const nonExistentId = 'non-existent-id';
      const response = await fetch(`${API_BASE_URL}/attachments/${nonExistentId}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data).toEqual(expect.objectContaining({
        error: 'Attachment not found',
      }));
    });
  });
});
