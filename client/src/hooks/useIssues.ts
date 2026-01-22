import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';
import type { JiraItem } from '../types';

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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const hasLoadedOnce = useRef(false);

  const fetchIssues = useCallback(async () => {
    try {
      if (hasLoadedOnce.current) {
        setIsRefreshing(true);
      } else {
        setIsInitialLoad(true);
      }
      setError(null);
      const response = await api.getIssues();
      setIssues(response.issues);
      setLastRefreshed(response.lastRefreshed ? new Date(response.lastRefreshed) : null);
      hasLoadedOnce.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIssues([]);
    } finally {
      setIsInitialLoad(false);
      setIsRefreshing(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      await api.refresh();
      await fetchIssues();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsRefreshing(false);
    }
  }, [fetchIssues]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const loading = isInitialLoad || isRefreshing;

  return { issues, loading, isInitialLoad, isRefreshing, error, lastRefreshed, refresh };
}
