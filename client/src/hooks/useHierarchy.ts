import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type { HierarchicalJiraItem } from '../types';
import { useLoadingState } from './useLoadingState';

interface UseHierarchyResult {
  hierarchy: HierarchicalJiraItem[];
  loading: boolean;
  isInitialLoad: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useHierarchy(): UseHierarchyResult {
  const [hierarchy, setHierarchy] = useState<HierarchicalJiraItem[]>([]);
  const { isInitialLoad, isRefreshing, loading, error, startLoading, finishLoading, setError } = useLoadingState();

  const fetchHierarchy = useCallback(async () => {
    try {
      startLoading();
      const data = await api.getHierarchy();
      setHierarchy(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setHierarchy([]);
    } finally {
      finishLoading();
    }
  }, [startLoading, finishLoading, setError]);

  const refresh = useCallback(async () => {
    startLoading();
    await api.refresh();
    await fetchHierarchy();
  }, [fetchHierarchy, startLoading]);

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  return { hierarchy, loading, isInitialLoad, isRefreshing, error, refresh };
}
