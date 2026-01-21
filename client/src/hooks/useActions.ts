import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type { ActionRequiredResult } from '../types';

interface UseActionsResult {
  actions: ActionRequiredResult | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useActions(): UseActionsResult {
  const [actions, setActions] = useState<ActionRequiredResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getActions();
      setActions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setActions(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await api.refresh();
    await fetchActions();
  }, [fetchActions]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  return { actions, loading, error, refresh };
}
