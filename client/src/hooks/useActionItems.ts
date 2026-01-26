import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type { ActionItemsResponse, CreateManualActionItemInput, UpdateManualActionItemInput, ManualActionItem } from '../types';
import { useLoadingState } from './useLoadingState';

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
  const { isInitialLoad, isRefreshing, loading, error, startLoading, finishLoading, setError } = useLoadingState();

  const fetchActionItems = useCallback(async () => {
    try {
      startLoading();
      const response = await api.getActionItems();
      setActionItems(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setActionItems(null);
    } finally {
      finishLoading();
    }
  }, [startLoading, finishLoading, setError]);

  const refresh = useCallback(async () => {
    try {
      startLoading();
      await api.refreshActionItems();
      await fetchActionItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      finishLoading();
    }
  }, [fetchActionItems, startLoading, finishLoading, setError]);

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
