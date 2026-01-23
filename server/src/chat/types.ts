// Core chat types and interfaces

import type { JiraItem } from '../types.js';

// ============================================================================
// Knowledge Source Types
// ============================================================================

export interface KnowledgeSourceMetadata {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  exampleQueries: string[];
  priority: number;
}

export interface QueryContext {
  query: string;
  sessionId: string;
  previousResults?: KnowledgeSourceResult[];
  filters?: Record<string, unknown>;
}

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

export interface KnowledgeSourceResult {
  sourceId: string;
  data: unknown;
  citations: Citation[];
  error?: string;
}

export interface KnowledgeSource {
  metadata: KnowledgeSourceMetadata;
  query(context: QueryContext): Promise<KnowledgeSourceResult>;
  isAvailable(): Promise<boolean>;
}

// ============================================================================
// Query Planning Types
// ============================================================================

export interface SourceSelection {
  sourceId: string;
  reason: string;
  filters?: Record<string, unknown>;
}

export interface QueryPhase {
  phase: number;
  sources: SourceSelection[];
  waitForPrevious: boolean;
}

export interface QueryPlan {
  phases: QueryPhase[];
  reasoning: string;
}

// ============================================================================
// Execution Types
// ============================================================================

export interface ExecutionResult {
  results: KnowledgeSourceResult[];
  citations: Citation[];
  timing: {
    startTime: number;
    endTime: number;
    phaseTimings: { phase: number; durationMs: number }[];
  };
}

// ============================================================================
// Chat Session Types
// ============================================================================

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

// ============================================================================
// Response Types
// ============================================================================

export interface SynthesizedResponse {
  content: string;
  citations: Citation[];
}

export interface ChatResponse {
  message: ChatMessage;
  sources: string[];
  executionTime: number;
}

// ============================================================================
// Streaming Types
// ============================================================================

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

export interface PlanningEvent extends StreamEvent {
  type: 'planning';
  data: { plan: QueryPlan };
}

export interface QueryingEvent extends StreamEvent {
  type: 'querying';
  data: { sourceId: string; status: 'started' | 'completed' };
}

export interface SynthesizingEvent extends StreamEvent {
  type: 'synthesizing';
  data: Record<string, never>;
}

export interface CitationEvent extends StreamEvent {
  type: 'citation';
  data: { citation: Citation; index: number };
}

export interface ContentEvent extends StreamEvent {
  type: 'content';
  data: { delta: string };
}

export interface DoneEvent extends StreamEvent {
  type: 'done';
  data: { message: ChatMessage };
}

export interface ErrorEvent extends StreamEvent {
  type: 'error';
  data: { error: string };
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface ChatRequest {
  sessionId?: string;
  message: string;
}

export interface SourcesResponse {
  sources: KnowledgeSourceMetadata[];
}

// ============================================================================
// Jira-specific Citation Type
// ============================================================================

export interface JiraIssueCitation extends Citation {
  type: 'jira-issue';
  metadata: {
    item: JiraItem;
  };
}

// ============================================================================
// Confluence-specific Citation Type
// ============================================================================

export interface ConfluencePageCitation extends Citation {
  type: 'confluence-page';
  metadata: {
    pageId: string;
    spaceKey: string;
    title: string;
  };
}
