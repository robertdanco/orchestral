import { useState, useRef, useCallback } from 'react';

export interface LoadingState {
  isInitialLoad: boolean;
  isRefreshing: boolean;
  loading: boolean;
  error: string | null;
}

export interface LoadingStateControls extends LoadingState {
  startLoading: () => void;
  finishLoading: () => void;
  setError: (error: string | null) => void;
}

/**
 * Shared hook for managing loading state across data-fetching hooks.
 * Handles the distinction between initial load and subsequent refreshes.
 */
export function useLoadingState(): LoadingStateControls {
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  const startLoading = useCallback(() => {
    if (hasLoadedOnce.current) {
      setIsRefreshing(true);
    } else {
      setIsInitialLoad(true);
    }
    setError(null);
  }, []);

  const finishLoading = useCallback(() => {
    hasLoadedOnce.current = true;
    setIsInitialLoad(false);
    setIsRefreshing(false);
  }, []);

  const loading = isInitialLoad || isRefreshing;

  return {
    isInitialLoad,
    isRefreshing,
    loading,
    error,
    startLoading,
    finishLoading,
    setError,
  };
}
