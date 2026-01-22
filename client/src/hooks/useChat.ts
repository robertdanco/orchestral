// Chat hook with SSE streaming support

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  ChatMessage,
  ChatProgress,
  Citation,
  StreamEvent,
  PlanningEventData,
  QueryingEventData,
  CitationEventData,
  ContentEventData,
  DoneEventData,
  ErrorEventData,
  KnowledgeSourceMetadata,
} from '../types/chat';

interface UseChatOptions {
  onCitationClick?: (citation: Citation) => void;
}

interface UseChatResult {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  progress: ChatProgress;
  citations: Citation[];
  sources: KnowledgeSourceMetadata[];
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
}

export function useChat(_options: UseChatOptions = {}): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ChatProgress>({
    phase: 'idle',
    queriedSources: [],
    completedSources: [],
  });
  const [citations, setCitations] = useState<Citation[]>([]);
  const [sources, setSources] = useState<KnowledgeSourceMetadata[]>([]);

  const sessionIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch available sources on mount
  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const response = await fetch('/api/chat/sources');
      if (response.ok) {
        const data = await response.json();
        setSources(data.sources || []);
      }
    } catch (err) {
      console.error('Failed to fetch sources:', err);
    }
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    setCitations([]);
    setProgress({
      phase: 'planning',
      queriedSources: [],
      completedSources: [],
    });

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          message: content,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Chat failed: ${response.status}`);
      }

      // Process SSE stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';
      const collectedCitations: Citation[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: StreamEvent = JSON.parse(line.slice(6));
              handleStreamEvent(
                event,
                collectedCitations,
                (content) => {
                  assistantContent += content;
                },
                setProgress,
                setCitations,
                setMessages
              );
            } catch (parseError) {
              console.error('Failed to parse SSE event:', parseError);
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setProgress((prev) => ({ ...prev, phase: 'idle' }));
    }
  }, [isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCitations([]);
    sessionIdRef.current = null;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    progress,
    citations,
    sources,
    sendMessage,
    clearMessages,
    clearError,
  };
}

function handleStreamEvent(
  event: StreamEvent,
  collectedCitations: Citation[],
  appendContent: (content: string) => void,
  setProgress: React.Dispatch<React.SetStateAction<ChatProgress>>,
  setCitations: React.Dispatch<React.SetStateAction<Citation[]>>,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
) {
  switch (event.type) {
    case 'planning': {
      const data = event.data as PlanningEventData;
      if (data.status === 'started') {
        setProgress((prev) => ({ ...prev, phase: 'planning' }));
      } else if (data.plan) {
        // Plan received, moving to querying
        const sourcesToQuery = data.plan.phases.flatMap((p) =>
          p.sources.map((s) => s.sourceId)
        );
        setProgress((prev) => ({
          ...prev,
          phase: 'querying',
          queriedSources: sourcesToQuery,
        }));
      }
      break;
    }

    case 'querying': {
      const data = event.data as QueryingEventData;
      if (data.status === 'completed') {
        setProgress((prev) => ({
          ...prev,
          completedSources: [...prev.completedSources, data.sourceId],
        }));
      }
      break;
    }

    case 'synthesizing': {
      setProgress((prev) => ({ ...prev, phase: 'synthesizing' }));
      break;
    }

    case 'citation': {
      const data = event.data as CitationEventData;
      collectedCitations.push(data.citation);
      setCitations([...collectedCitations]);
      break;
    }

    case 'content': {
      const data = event.data as ContentEventData;
      appendContent(data.delta);
      break;
    }

    case 'done': {
      const data = event.data as DoneEventData;
      const message: ChatMessage = {
        ...data.message,
        timestamp: new Date(data.message.timestamp),
      };
      setMessages((prev) => [...prev, message]);
      break;
    }

    case 'error': {
      const data = event.data as ErrorEventData;
      console.error('Stream error:', data.error);
      break;
    }
  }
}
