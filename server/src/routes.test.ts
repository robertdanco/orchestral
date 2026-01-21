import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createRouter } from './routes.js';
import { Cache } from './cache.js';
import { JiraClient } from './jira/client.js';

describe('API Routes', () => {
  let app: express.Express;
  let cache: Cache;
  let mockClient: JiraClient;

  const mockItem = {
    key: 'PROJ-1',
    summary: 'Test',
    type: 'story' as const,
    status: 'To Do',
    statusCategory: 'todo' as const,
    assignee: null,
    parentKey: null,
    estimate: null,
    created: '2024-01-01T00:00:00Z',
    updated: '2024-01-01T00:00:00Z',
    labels: [],
    blocked: false,
    blockedReason: null,
    url: 'https://test.atlassian.net/browse/PROJ-1',
  };

  beforeEach(() => {
    cache = new Cache();
    mockClient = {
      fetchIssues: vi.fn().mockResolvedValue([mockItem]),
      getProjectKeys: vi.fn().mockReturnValue(['PROJ']),
    } as unknown as JiraClient;

    app = express();
    app.use(express.json());
    app.use('/api', createRouter(cache, mockClient));
  });

  describe('GET /api/issues', () => {
    it('returns cached issues', async () => {
      cache.setIssues([mockItem]);

      const response = await request(app).get('/api/issues');

      expect(response.status).toBe(200);
      expect(response.body.issues).toHaveLength(1);
      expect(response.body.lastRefreshed).toBeDefined();
    });

    it('fetches from Jira if cache is empty', async () => {
      const response = await request(app).get('/api/issues');

      expect(mockClient.fetchIssues).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body.issues).toHaveLength(1);
    });
  });

  describe('POST /api/refresh', () => {
    it('clears cache and fetches fresh data', async () => {
      cache.setIssues([mockItem]);

      const response = await request(app).post('/api/refresh');

      expect(mockClient.fetchIssues).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Refreshed');
    });
  });

  describe('GET /api/issues/:key', () => {
    it('returns single issue', async () => {
      cache.setIssues([mockItem]);

      const response = await request(app).get('/api/issues/PROJ-1');

      expect(response.status).toBe(200);
      expect(response.body.key).toBe('PROJ-1');
    });

    it('returns 404 for unknown issue', async () => {
      cache.setIssues([mockItem]);

      const response = await request(app).get('/api/issues/PROJ-999');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/actions', () => {
    it('returns action required items', async () => {
      cache.setIssues([{ ...mockItem, assignee: null, statusCategory: 'inprogress' }]);

      const response = await request(app).get('/api/actions');

      expect(response.status).toBe(200);
      expect(response.body.unassigned).toHaveLength(1);
    });
  });

  describe('GET /api/hierarchy', () => {
    it('returns hierarchical structure', async () => {
      cache.setIssues([mockItem]);

      const response = await request(app).get('/api/hierarchy');

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
    });
  });
});
