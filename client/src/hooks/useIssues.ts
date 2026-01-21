import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type { JiraItem } from '../types';

interface UseIssuesResult {
  issues: JiraItem[];
  loading: boolean;
  error: string | null;
  lastRefreshed: Date | null;
  refresh: () => Promise<void>;
}

export function useIssues(): UseIssuesResult {
  const [issues, setIssues] = useState<JiraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getIssues();
      setIssues(response.issues);
      setLastRefreshed(response.lastRefreshed ? new Date(response.lastRefreshed) : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await api.refresh();
      await fetchIssues();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [fetchIssues]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  return { issues, loading, error, lastRefreshed, refresh };
}
