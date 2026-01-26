import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type { ConfluenceSpaceWithPages } from '../types';
import { useLoadingState } from './useLoadingState';

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
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const { isInitialLoad, isRefreshing, loading, error, startLoading, finishLoading, setError } = useLoadingState();

  const fetchConfluence = useCallback(async () => {
    try {
      startLoading();
      const response = await api.getConfluenceHierarchy();
      setSpaces(response.spaces);
      setLastRefreshed(response.lastRefreshed ? new Date(response.lastRefreshed) : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSpaces([]);
    } finally {
      finishLoading();
    }
  }, [startLoading, finishLoading, setError]);

  const refresh = useCallback(async () => {
    try {
      startLoading();
      await api.refreshConfluence();
      await fetchConfluence();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      finishLoading();
    }
  }, [fetchConfluence, startLoading, finishLoading, setError]);

  useEffect(() => {
    fetchConfluence();
  }, [fetchConfluence]);

  return { spaces, loading, isInitialLoad, isRefreshing, error, lastRefreshed, refresh };
}
