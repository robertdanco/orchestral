import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type {
  OnboardingSettings,
  OnboardingStatus,
  UpdateOnboardingSettingsInput,
  JiraProjectInfo,
  JiraStatusInfo,
  ConfluenceSpaceInfo,
} from '../types';
import { useLoadingState } from './useLoadingState';

interface UseOnboardingResult {
  // Status
  status: OnboardingStatus | null;
  isComplete: boolean;

  // Loading states
  loading: boolean;
  isInitialLoad: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Discovery data
  connected: boolean | null;
  projects: JiraProjectInfo[];
  statuses: JiraStatusInfo[];
  spaces: ConfluenceSpaceInfo[];
  confluenceAvailable: boolean;

  // Actions
  checkConnection: () => Promise<boolean>;
  fetchProjects: () => Promise<JiraProjectInfo[]>;
  fetchStatuses: () => Promise<JiraStatusInfo[]>;
  fetchSpaces: () => Promise<{ spaces: ConfluenceSpaceInfo[]; available: boolean }>;
  updateSettings: (input: UpdateOnboardingSettingsInput) => Promise<OnboardingSettings>;
  completeOnboarding: () => Promise<OnboardingSettings>;
  resetOnboarding: () => Promise<OnboardingSettings>;
  refetch: () => Promise<void>;
}

export function useOnboarding(): UseOnboardingResult {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [projects, setProjects] = useState<JiraProjectInfo[]>([]);
  const [statuses, setStatuses] = useState<JiraStatusInfo[]>([]);
  const [spaces, setSpaces] = useState<ConfluenceSpaceInfo[]>([]);
  const [confluenceAvailable, setConfluenceAvailable] = useState(false);
  const { isInitialLoad, isRefreshing, loading, error, startLoading, finishLoading, setError } = useLoadingState();

  const fetchStatus = useCallback(async () => {
    try {
      startLoading();
      const response = await api.getOnboardingStatus();
      setStatus(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus(null);
    } finally {
      finishLoading();
    }
  }, [startLoading, finishLoading, setError]);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const response = await api.getOnboardingConnection();
      setConnected(response.connected);
      return response.connected;
    } catch {
      setConnected(false);
      return false;
    }
  }, []);

  const fetchProjects = useCallback(async (): Promise<JiraProjectInfo[]> => {
    try {
      const response = await api.getOnboardingProjects();
      setProjects(response.projects);
      return response.projects;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      return [];
    }
  }, [setError]);

  const fetchStatuses = useCallback(async (): Promise<JiraStatusInfo[]> => {
    try {
      const response = await api.getOnboardingStatuses();
      setStatuses(response.statuses);
      return response.statuses;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statuses');
      return [];
    }
  }, [setError]);

  const fetchSpaces = useCallback(async (): Promise<{ spaces: ConfluenceSpaceInfo[]; available: boolean }> => {
    try {
      const response = await api.getOnboardingSpaces();
      setSpaces(response.spaces);
      setConfluenceAvailable(response.available);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch spaces');
      return { spaces: [], available: false };
    }
  }, [setError]);

  const updateSettings = useCallback(async (input: UpdateOnboardingSettingsInput): Promise<OnboardingSettings> => {
    const updated = await api.updateOnboardingSettings(input);
    setStatus(prev => prev ? { ...prev, settings: updated } : null);
    return updated;
  }, []);

  const completeOnboarding = useCallback(async (): Promise<OnboardingSettings> => {
    const completed = await api.completeOnboarding();
    setStatus({ isComplete: true, settings: completed });
    return completed;
  }, []);

  const resetOnboarding = useCallback(async (): Promise<OnboardingSettings> => {
    const reset = await api.resetOnboarding();
    setStatus({ isComplete: false, settings: reset });
    setConnected(null);
    setProjects([]);
    setStatuses([]);
    setSpaces([]);
    setConfluenceAvailable(false);
    return reset;
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    isComplete: status?.isComplete ?? false,
    loading,
    isInitialLoad,
    isRefreshing,
    error,
    connected,
    projects,
    statuses,
    spaces,
    confluenceAvailable,
    checkConnection,
    fetchProjects,
    fetchStatuses,
    fetchSpaces,
    updateSettings,
    completeOnboarding,
    resetOnboarding,
    refetch: fetchStatus,
  };
}
