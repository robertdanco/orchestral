import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from './api';

describe('api', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('fetches issues', async () => {
    const mockResponse = {
      issues: [{ key: 'PROJ-1', summary: 'Test' }],
      lastRefreshed: '2024-01-01T00:00:00Z',
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));

    const result = await api.getIssues();

    expect(fetch).toHaveBeenCalledWith('/api/issues', undefined);
    expect(result.issues).toHaveLength(1);

    vi.unstubAllGlobals();
  });

  it('throws on error response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));

    await expect(api.getIssues()).rejects.toThrow('API error: 500');

    vi.unstubAllGlobals();
  });
});
