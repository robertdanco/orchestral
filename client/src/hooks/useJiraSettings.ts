import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type { JiraActionSettings, UpdateJiraActionSettingsInput } from '../types';
import { useLoadingState } from './useLoadingState';

interface UseJiraSettingsResult {
  settings: JiraActionSettings | null;
  loading: boolean;
  isInitialLoad: boolean;
  isRefreshing: boolean;
  error: string | null;
  updateSettings: (input: UpdateJiraActionSettingsInput) => Promise<JiraActionSettings>;
  resetSettings: () => Promise<JiraActionSettings>;
  refetch: () => Promise<void>;
}

export function useJiraSettings(): UseJiraSettingsResult {
  const [settings, setSettings] = useState<JiraActionSettings | null>(null);
  const { isInitialLoad, isRefreshing, loading, error, startLoading, finishLoading, setError } = useLoadingState();

  const fetchSettings = useCallback(async () => {
    try {
      startLoading();
      const response = await api.getJiraSettings();
      setSettings(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSettings(null);
    } finally {
      finishLoading();
    }
  }, [startLoading, finishLoading, setError]);

  const updateSettings = useCallback(async (input: UpdateJiraActionSettingsInput): Promise<JiraActionSettings> => {
    const updated = await api.updateJiraSettings(input);
    setSettings(updated);
    return updated;
  }, []);

  const resetSettings = useCallback(async (): Promise<JiraActionSettings> => {
    const reset = await api.resetJiraSettings();
    setSettings(reset);
    return reset;
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    isInitialLoad,
    isRefreshing,
    error,
    updateSettings,
    resetSettings,
    refetch: fetchSettings,
  };
}
