import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';
import type { ActionItemsResponse, CreateManualActionItemInput, UpdateManualActionItemInput, ManualActionItem } from '../types';

interface UseActionItemsResult {
  actionItems: ActionItemsResponse | null;
  loading: boolean;
  isInitialLoad: boolean;
  isRefreshing: boolean;
  error: string | null;
  totalCount: number;
  refresh: () => Promise<void>;
  // Manual item mutations
  createManualItem: (input: CreateManualActionItemInput) => Promise<ManualActionItem>;
  updateManualItem: (id: string, input: UpdateManualActionItemInput) => Promise<ManualActionItem>;
  deleteManualItem: (id: string) => Promise<void>;
  completeManualItem: (id: string) => Promise<ManualActionItem>;
  uncompleteManualItem: (id: string) => Promise<ManualActionItem>;
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

  // Manual item mutations
  const createManualItem = useCallback(async (input: CreateManualActionItemInput): Promise<ManualActionItem> => {
    const item = await api.createManualActionItem(input);
    await fetchActionItems();
    return item;
  }, [fetchActionItems]);

  const updateManualItem = useCallback(async (id: string, input: UpdateManualActionItemInput): Promise<ManualActionItem> => {
    const item = await api.updateManualActionItem(id, input);
    await fetchActionItems();
    return item;
  }, [fetchActionItems]);

  const deleteManualItem = useCallback(async (id: string): Promise<void> => {
    await api.deleteManualActionItem(id);
    await fetchActionItems();
  }, [fetchActionItems]);

  const completeManualItem = useCallback(async (id: string): Promise<ManualActionItem> => {
    const item = await api.completeManualActionItem(id);
    await fetchActionItems();
    return item;
  }, [fetchActionItems]);

  const uncompleteManualItem = useCallback(async (id: string): Promise<ManualActionItem> => {
    const item = await api.uncompleteManualActionItem(id);
    await fetchActionItems();
    return item;
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
    createManualItem,
    updateManualItem,
    deleteManualItem,
    completeManualItem,
    uncompleteManualItem,
  };
}
