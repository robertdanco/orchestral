import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, ApiError } from './api';

describe('api', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('ApiError', () => {
    it('creates error with all properties', () => {
      const error = new ApiError('Test error', 404, 'Not Found', '{"detail":"Not found"}');

      expect(error.message).toBe('Test error');
      expect(error.status).toBe(404);
      expect(error.statusText).toBe('Not Found');
      expect(error.body).toBe('{"detail":"Not found"}');
      expect(error.name).toBe('ApiError');
    });

    it('isApiError returns true for ApiError instances', () => {
      const apiError = new ApiError('Test', 500, 'Internal Server Error');
      const regularError = new Error('Test');

      expect(ApiError.isApiError(apiError)).toBe(true);
      expect(ApiError.isApiError(regularError)).toBe(false);
      expect(ApiError.isApiError(null)).toBe(false);
      expect(ApiError.isApiError(undefined)).toBe(false);
    });
  });

  describe('getIssues', () => {
    it('returns issues on success', async () => {
      const mockResponse = {
        issues: [{ key: 'PROJ-1', summary: 'Test' }],
        lastRefreshed: '2024-01-01T00:00:00Z',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.getIssues();

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith('/api/issues', undefined);
    });

    it('throws ApiError on failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server error details'),
      });

      await expect(api.getIssues()).rejects.toThrow(ApiError);

      try {
        await api.getIssues();
      } catch (error) {
        expect(ApiError.isApiError(error)).toBe(true);
        if (ApiError.isApiError(error)) {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Internal Server Error');
          expect(error.body).toBe('Server error details');
        }
      }
    });
  });

  describe('getIssue', () => {
    it('fetches single issue', async () => {
      const mockIssue = { key: 'PROJ-1', summary: 'Test' };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockIssue),
      });

      const result = await api.getIssue('PROJ-1');

      expect(result).toEqual(mockIssue);
      expect(fetch).toHaveBeenCalledWith('/api/issues/PROJ-1', undefined);
    });
  });

  describe('getHierarchy', () => {
    it('fetches hierarchy', async () => {
      const mockHierarchy = [{ key: 'PROJ-1', children: [] }];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHierarchy),
      });

      const result = await api.getHierarchy();

      expect(result).toEqual(mockHierarchy);
      expect(fetch).toHaveBeenCalledWith('/api/hierarchy', undefined);
    });
  });

  describe('getActions', () => {
    it('fetches actions', async () => {
      const mockActions = {
        blockers: [],
        blocked: [],
        stale: [],
        missingDetails: [],
        unassigned: [],
        unestimated: [],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockActions),
      });

      const result = await api.getActions();

      expect(result).toEqual(mockActions);
      expect(fetch).toHaveBeenCalledWith('/api/actions', undefined);
    });
  });

  describe('refresh', () => {
    it('posts to refresh endpoint', async () => {
      const mockResult = { message: 'Refreshed', count: 10 };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResult),
      });

      const result = await api.refresh();

      expect(result).toEqual(mockResult);
      expect(fetch).toHaveBeenCalledWith('/api/refresh', { method: 'POST' });
    });
  });
});
