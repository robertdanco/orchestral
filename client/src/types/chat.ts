// Client-side chat types

import type { JiraItem } from '../types';

export type CitationType =
  | 'jira-issue'
  | 'confluence-page'
  | 'document'
  | 'web'
  | 'custom';

export interface Citation {
  sourceId: string;
  type: CitationType;
  id: string;
  title: string;
  url: string | null;
  snippet?: string;
  metadata?: Record<string, unknown>;
}

export interface JiraIssueCitation extends Citation {
  type: 'jira-issue';
  metadata: {
    item: JiraItem;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeSourceMetadata {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  exampleQueries: string[];
  priority: number;
}

// Stream event types
export type StreamEventType =
  | 'planning'
  | 'querying'
  | 'synthesizing'
  | 'citation'
  | 'content'
  | 'done'
  | 'error';

export interface StreamEvent {
  type: StreamEventType;
  data: unknown;
}

export interface PlanningEventData {
  status?: 'started';
  plan?: {
    phases: Array<{
      phase: number;
      sources: Array<{ sourceId: string; reason: string }>;
    }>;
    reasoning: string;
  };
}

export interface QueryingEventData {
  sourceId: string;
  status: 'started' | 'completed';
}

export interface CitationEventData {
  citation: Citation;
  index: number;
}

export interface ContentEventData {
  delta: string;
}

export interface DoneEventData {
  message: ChatMessage;
}

export interface ErrorEventData {
  error: string;
}

// Chat progress state
export type ChatPhase = 'idle' | 'planning' | 'querying' | 'synthesizing';

export interface ChatProgress {
  phase: ChatPhase;
  queriedSources: string[];
  completedSources: string[];
}

// API response types
export interface ChatResponse {
  message: ChatMessage;
  sources: string[];
  executionTime: number;
}

export interface SourcesResponse {
  sources: KnowledgeSourceMetadata[];
}

// Helper type guard for Jira citations
export function isJiraIssueCitation(
  citation: Citation
): citation is JiraIssueCitation {
  return (
    citation.type === 'jira-issue' &&
    citation.metadata !== undefined &&
    'item' in citation.metadata
  );
}
