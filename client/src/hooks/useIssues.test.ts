import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useIssues } from './useIssues';
import { api } from '../api';

vi.mock('../api');

describe('useIssues', () => {
  const mockIssues = [
    { key: 'PROJ-1', summary: 'Test', type: 'story', statusCategory: 'todo' },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('fetches issues on mount', async () => {
    vi.mocked(api.getIssues).mockResolvedValue({
      issues: mockIssues as any,
      lastRefreshed: '2024-01-01T00:00:00Z',
    });

    const { result } = renderHook(() => useIssues());

    expect(result.current.loading).toBe(true);
    expect(result.current.isInitialLoad).toBe(true);
    expect(result.current.isRefreshing).toBe(false);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.issues).toHaveLength(1);
    expect(result.current.error).toBeNull();
    expect(result.current.isInitialLoad).toBe(false);
    expect(result.current.isRefreshing).toBe(false);
  });

  it('handles error', async () => {
    vi.mocked(api.getIssues).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useIssues());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.issues).toEqual([]);
  });

  it('refreshes data', async () => {
    vi.mocked(api.getIssues).mockResolvedValue({
      issues: mockIssues as any,
      lastRefreshed: '2024-01-01T00:00:00Z',
    });
    vi.mocked(api.refresh).mockResolvedValue({ message: 'Refreshed', count: 1 });

    const { result } = renderHook(() => useIssues());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isInitialLoad).toBe(false);

    await act(async () => {
      await result.current.refresh();
    });

    expect(api.refresh).toHaveBeenCalled();
    expect(api.getIssues).toHaveBeenCalledTimes(2);
  });

  it('sets isRefreshing on subsequent fetches, not isInitialLoad', async () => {
    vi.mocked(api.getIssues).mockResolvedValue({
      issues: mockIssues as any,
      lastRefreshed: '2024-01-01T00:00:00Z',
    });
    vi.mocked(api.refresh).mockResolvedValue({ message: 'Refreshed', count: 1 });

    const { result } = renderHook(() => useIssues());

    // Initial load
    expect(result.current.isInitialLoad).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // After initial load, isInitialLoad should be false
    expect(result.current.isInitialLoad).toBe(false);

    // Trigger refresh
    await act(async () => {
      await result.current.refresh();
    });

    // After refresh, isInitialLoad should still be false
    expect(result.current.isInitialLoad).toBe(false);
    expect(result.current.isRefreshing).toBe(false);
  });
});
