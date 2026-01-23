import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';
import type { ActionItemsResponse } from '../types';

interface UseActionItemsResult {
  actionItems: ActionItemsResponse | null;
  loading: boolean;
  isInitialLoad: boolean;
  isRefreshing: boolean;
  error: string | null;
  totalCount: number;
  refresh: () => Promise<void>;
}

export function useActionItems(): UseActionItemsResult {
  const [actionItems, setActionItems] = useState<ActionItemsResponse | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  const fetchActionItems = useCallback(async () => {
    try {
      if (hasLoadedOnce.current) {
        setIsRefreshing(true);
      } else {
        setIsInitialLoad(true);
      }
      setError(null);
      const response = await api.getActionItems();
      setActionItems(response);
      hasLoadedOnce.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setActionItems(null);
    } finally {
      setIsInitialLoad(false);
      setIsRefreshing(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      await api.refreshActionItems();
      await fetchActionItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsRefreshing(false);
    }
  }, [fetchActionItems]);

  useEffect(() => {
    fetchActionItems();
  }, [fetchActionItems]);

  const loading = isInitialLoad || isRefreshing;
  const totalCount = actionItems?.totalCount ?? 0;

  return {
    actionItems,
    loading,
    isInitialLoad,
    isRefreshing,
    error,
    totalCount,
    refresh,
  };
}
