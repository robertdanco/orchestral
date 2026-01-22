import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';
import type { HierarchicalJiraItem } from '../types';

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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  const fetchHierarchy = useCallback(async () => {
    try {
      if (hasLoadedOnce.current) {
        setIsRefreshing(true);
      } else {
        setIsInitialLoad(true);
      }
      setError(null);
      const data = await api.getHierarchy();
      setHierarchy(data);
      hasLoadedOnce.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setHierarchy([]);
    } finally {
      setIsInitialLoad(false);
      setIsRefreshing(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await api.refresh();
    await fetchHierarchy();
  }, [fetchHierarchy]);

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  const loading = isInitialLoad || isRefreshing;

  return { hierarchy, loading, isInitialLoad, isRefreshing, error, refresh };
}
