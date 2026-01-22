import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';
import type { ActionRequiredResult } from '../types';

interface UseActionsResult {
  actions: ActionRequiredResult | null;
  loading: boolean;
  isInitialLoad: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useActions(): UseActionsResult {
  const [actions, setActions] = useState<ActionRequiredResult | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  const fetchActions = useCallback(async () => {
    try {
      if (hasLoadedOnce.current) {
        setIsRefreshing(true);
      } else {
        setIsInitialLoad(true);
      }
      setError(null);
      const data = await api.getActions();
      setActions(data);
      hasLoadedOnce.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setActions(null);
    } finally {
      setIsInitialLoad(false);
      setIsRefreshing(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await api.refresh();
    await fetchActions();
  }, [fetchActions]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  const loading = isInitialLoad || isRefreshing;

  return { actions, loading, isInitialLoad, isRefreshing, error, refresh };
}
