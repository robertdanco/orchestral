import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type { ActionRequiredResult } from '../types';
import { useLoadingState } from './useLoadingState';

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
  const { isInitialLoad, isRefreshing, loading, error, startLoading, finishLoading, setError } = useLoadingState();

  const fetchActions = useCallback(async () => {
    try {
      startLoading();
      const data = await api.getActions();
      setActions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setActions(null);
    } finally {
      finishLoading();
    }
  }, [startLoading, finishLoading, setError]);

  const refresh = useCallback(async () => {
    startLoading();
    await api.refresh();
    await fetchActions();
  }, [fetchActions, startLoading]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  return { actions, loading, isInitialLoad, isRefreshing, error, refresh };
}
