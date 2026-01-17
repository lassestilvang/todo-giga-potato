import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import prisma from '@/lib/prisma';

const API_BASE_URL = 'http://localhost:32754/api';
const DEFAULT_USER_ID = 'cmki1ekso0000i4ezi4fhaecm';

describe('Labels API', () => {
  let testLabelId: string;

  beforeEach(async () => {
    // Create a test label for update/delete tests
    const testLabel = await prisma.label.create({
      data: {
        name: 'Test Label',
        color: '#ff0000',
        userId: DEFAULT_USER_ID,
      },
    });
    testLabelId = testLabel.id;
  });

  afterEach(async () => {
    // Cleanup test data
    await prisma.label.deleteMany({
      where: { id: testLabelId },
    });
  });

  describe('GET /api/labels', () => {
    it('should return all labels for the default user', async () => {
      const response = await fetch(`${API_BASE_URL}/labels`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toBeInstanceOf(Array);
      data.forEach((label: any) => {
        expect(label.userId).toBe(DEFAULT_USER_ID);
        expect(typeof label.name).toBe('string');
        expect(typeof label.color).toBe('string');
      });
    });

    it('should return labels for specific user', async () => {
      const response = await fetch(`${API_BASE_URL}/labels?userId=${DEFAULT_USER_ID}`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toBeInstanceOf(Array);
      data.forEach((label: any) => {
        expect(label.userId).toBe(DEFAULT_USER_ID);
      });
    });
  });

  describe('POST /api/labels', () => {
    it('should create a new label with valid data', async () => {
      const newLabel = {
        name: 'New Label',
        color: '#00ff00',
        userId: DEFAULT_USER_ID,
      };

      const response = await fetch(`${API_BASE_URL}/labels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLabel),
      });

      expect(response.status).toBe(201);
      
      const label = await response.json();
      expect(label).toEqual(expect.objectContaining({
        id: expect.any(String),
        name: newLabel.name,
        color: newLabel.color,
        userId: newLabel.userId,
      }));
    });

    it('should return 400 error with invalid data', async () => {
      const invalidLabel = {
        // Missing required fields
        color: '#00ff00',
        userId: DEFAULT_USER_ID,
      };

      const response = await fetch(`${API_BASE_URL}/labels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidLabel),
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toEqual(expect.objectContaining({
        error: 'Validation error',
        details: expect.any(Array),
      }));
    });
  });

  describe('GET /api/labels/[id]', () => {
    it('should return a specific label by ID', async () => {
      const response = await fetch(`${API_BASE_URL}/labels/${testLabelId}`);
      expect(response.status).toBe(200);
      
      const label = await response.json();
      expect(label).toEqual(expect.objectContaining({
        id: testLabelId,
        name: 'Test Label',
        color: '#ff0000',
      }));
    });

    it('should return 404 for non-existent label', async () => {
      const nonExistentId = 'non-existent-id';
      const response = await fetch(`${API_BASE_URL}/labels/${nonExistentId}`);
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data).toEqual(expect.objectContaining({
        error: 'Label not found',
      }));
    });
  });

  describe('PUT /api/labels/[id]', () => {
    it('should update a label with valid data', async () => {
      const updates = {
        name: 'Updated Test Label',
        color: '#0000ff',
      };

      const response = await fetch(`${API_BASE_URL}/labels/${testLabelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      expect(response.status).toBe(200);
      
      const label = await response.json();
      expect(label).toEqual(expect.objectContaining({
        id: testLabelId,
        name: updates.name,
        color: updates.color,
      }));
    });

    it('should return 404 for non-existent label', async () => {
      const nonExistentId = 'non-existent-id';
      const response = await fetch(`${API_BASE_URL}/labels/${nonExistentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Updated Label' }),
      });

      expect(response.status).toBe(404);
    });

    it('should return 400 with invalid data', async () => {
      const response = await fetch(`${API_BASE_URL}/labels/${testLabelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: '', color: '' }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/labels/[id]', () => {
    it('should delete a label by ID', async () => {
      const response = await fetch(`${API_BASE_URL}/labels/${testLabelId}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual(expect.objectContaining({
        message: 'Label deleted successfully',
      }));

      // Verify label was deleted
      const checkResponse = await fetch(`${API_BASE_URL}/labels/${testLabelId}`);
      expect(checkResponse.status).toBe(404);
    });

    it('should return 404 for non-existent label', async () => {
      const nonExistentId = 'non-existent-id';
      const response = await fetch(`${API_BASE_URL}/labels/${nonExistentId}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(404);
    });
  });
});
