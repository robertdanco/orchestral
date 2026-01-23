import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';
import type { ConfluenceSpaceWithPages } from '../types';

interface UseConfluenceResult {
  spaces: ConfluenceSpaceWithPages[];
  loading: boolean;
  isInitialLoad: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastRefreshed: Date | null;
  refresh: () => Promise<void>;
}

export function useConfluence(): UseConfluenceResult {
  const [spaces, setSpaces] = useState<ConfluenceSpaceWithPages[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const hasLoadedOnce = useRef(false);

  const fetchConfluence = useCallback(async () => {
    try {
      if (hasLoadedOnce.current) {
        setIsRefreshing(true);
      } else {
        setIsInitialLoad(true);
      }
      setError(null);
      const response = await api.getConfluenceHierarchy();
      setSpaces(response.spaces);
      setLastRefreshed(response.lastRefreshed ? new Date(response.lastRefreshed) : null);
      hasLoadedOnce.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSpaces([]);
    } finally {
      setIsInitialLoad(false);
      setIsRefreshing(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      await api.refreshConfluence();
      await fetchConfluence();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsRefreshing(false);
    }
  }, [fetchConfluence]);

  useEffect(() => {
    fetchConfluence();
  }, [fetchConfluence]);

  const loading = isInitialLoad || isRefreshing;

  return { spaces, loading, isInitialLoad, isRefreshing, error, lastRefreshed, refresh };
}
