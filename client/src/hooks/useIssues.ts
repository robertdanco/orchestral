import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type { JiraItem } from '../types';
import { useLoadingState } from './useLoadingState';

interface UseIssuesResult {
  issues: JiraItem[];
  loading: boolean;
  isInitialLoad: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastRefreshed: Date | null;
  refresh: () => Promise<void>;
}

export function useIssues(): UseIssuesResult {
  const [issues, setIssues] = useState<JiraItem[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const { isInitialLoad, isRefreshing, loading, error, startLoading, finishLoading, setError } = useLoadingState();

  const fetchIssues = useCallback(async () => {
    try {
      startLoading();
      const response = await api.getIssues();
      setIssues(response.issues);
      setLastRefreshed(response.lastRefreshed ? new Date(response.lastRefreshed) : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIssues([]);
    } finally {
      finishLoading();
    }
  }, [startLoading, finishLoading, setError]);

  const refresh = useCallback(async () => {
    try {
      startLoading();
      await api.refresh();
      await fetchIssues();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      finishLoading();
    }
  }, [fetchIssues, startLoading, finishLoading, setError]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  return { issues, loading, isInitialLoad, isRefreshing, error, lastRefreshed, refresh };
}
