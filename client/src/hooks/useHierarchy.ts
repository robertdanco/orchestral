import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type { HierarchicalJiraItem } from '../types';

interface UseHierarchyResult {
  hierarchy: HierarchicalJiraItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useHierarchy(): UseHierarchyResult {
  const [hierarchy, setHierarchy] = useState<HierarchicalJiraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHierarchy = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getHierarchy();
      setHierarchy(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setHierarchy([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await api.refresh();
    await fetchHierarchy();
  }, [fetchHierarchy]);

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  return { hierarchy, loading, error, refresh };
}
