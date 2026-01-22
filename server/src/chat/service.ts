// Chat service - orchestrates the full chat flow

import { v4 as uuidv4 } from 'uuid';
import type { LLMClient } from './llm/client.js';
import { QueryPlanner } from './planner.js';
import { ExecutionEngine } from './executor.js';
import { Synthesizer } from './synthesizer.js';
import type {
  KnowledgeSource,
  KnowledgeSourceMetadata,
  ChatSession,
  ChatMessage,
  ChatResponse,
  QueryContext,
  StreamEvent,
} from './types.js';

export interface ChatServiceOptions {
  llmClient: LLMClient;
}

export class ChatService {
  private llmClient: LLMClient;
  private sources: Map<string, KnowledgeSource> = new Map();
  private sessions: Map<string, ChatSession> = new Map();
  private planner: QueryPlanner;
  private synthesizer: Synthesizer;

  constructor(options: ChatServiceOptions) {
    this.llmClient = options.llmClient;
    this.planner = new QueryPlanner({ llmClient: this.llmClient });
    this.synthesizer = new Synthesizer({ llmClient: this.llmClient });
  }

  registerSource(source: KnowledgeSource): void {
    this.sources.set(source.metadata.id, source);
  }

  unregisterSource(sourceId: string): void {
    this.sources.delete(sourceId);
  }

  getAvailableSources(): KnowledgeSourceMetadata[] {
    return Array.from(this.sources.values()).map((s) => s.metadata);
  }

  async getAvailableSourcesFiltered(): Promise<KnowledgeSourceMetadata[]> {
    const availablePromises = Array.from(this.sources.entries()).map(
      async ([id, source]) => {
        try {
          const available = await source.isAvailable();
          return available ? source.metadata : null;
        } catch {
          console.warn(`Source ${id} availability check failed`);
          return null;
        }
      }
    );

    const results = await Promise.all(availablePromises);
    return results.filter((m): m is KnowledgeSourceMetadata => m !== null);
  }

  getOrCreateSession(sessionId?: string): ChatSession {
    if (sessionId && this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }

    const newSession: ChatSession = {
      id: sessionId || uuidv4(),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessions.set(newSession.id, newSession);
    return newSession;
  }

  async chat(
    message: string,
    sessionId?: string
  ): Promise<ChatResponse> {
    const session = this.getOrCreateSession(sessionId);
    const startTime = Date.now();

    // Add user message to session
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    session.messages.push(userMessage);

    // Get available sources
    const availableSources = await this.getAvailableSourcesFiltered();

    // Create query plan
    const plan = await this.planner.createPlan(message, availableSources);

    // Execute plan
    const executor = new ExecutionEngine({ sources: this.sources });
    const queryContext: QueryContext = {
      query: message,
      sessionId: session.id,
    };
    const executionResult = await executor.execute(plan, queryContext);

    // Synthesize response
    const synthesized = await this.synthesizer.synthesize(
      message,
      executionResult.results,
      executionResult.citations
    );

    // Create assistant message
    const assistantMessage: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: synthesized.content,
      citations: synthesized.citations,
      timestamp: new Date(),
    };
    session.messages.push(assistantMessage);
    session.updatedAt = new Date();

    return {
      message: assistantMessage,
      sources: plan.phases.flatMap((p) => p.sources.map((s) => s.sourceId)),
      executionTime: Date.now() - startTime,
    };
  }

  async *chatStream(
    message: string,
    sessionId?: string
  ): AsyncGenerator<StreamEvent> {
    const session = this.getOrCreateSession(sessionId);

    // Add user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    session.messages.push(userMessage);

    // Get available sources
    const availableSources = await this.getAvailableSourcesFiltered();

    // Plan
    yield { type: 'planning', data: { status: 'started' } };
    const plan = await this.planner.createPlan(message, availableSources);
    yield { type: 'planning', data: { plan } };

    // Execute with progress events
    const sourceEvents: StreamEvent[] = [];
    const executor = new ExecutionEngine({
      sources: this.sources,
      onSourceStart: (sourceId) => {
        sourceEvents.push({
          type: 'querying',
          data: { sourceId, status: 'started' },
        });
      },
      onSourceComplete: (sourceId) => {
        sourceEvents.push({
          type: 'querying',
          data: { sourceId, status: 'completed' },
        });
      },
    });

    const queryContext: QueryContext = {
      query: message,
      sessionId: session.id,
    };

    // Yield querying start events
    for (const event of sourceEvents) {
      yield event;
    }
    sourceEvents.length = 0;

    const executionResult = await executor.execute(plan, queryContext);

    // Yield any remaining source events
    for (const event of sourceEvents) {
      yield event;
    }

    // Emit citations
    for (let i = 0; i < executionResult.citations.length; i++) {
      yield {
        type: 'citation',
        data: { citation: executionResult.citations[i], index: i + 1 },
      };
    }

    // Synthesize with streaming
    yield { type: 'synthesizing', data: {} };

    let fullContent = '';
    const synthesized = await this.synthesizer.synthesizeStream(
      message,
      executionResult.results,
      executionResult.citations,
      (delta) => {
        fullContent += delta;
      }
    );

    // Emit content in chunks (we need to actually stream this)
    // For now, emit the full content
    yield { type: 'content', data: { delta: synthesized.content } };

    // Create and store assistant message
    const assistantMessage: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: synthesized.content,
      citations: synthesized.citations,
      timestamp: new Date(),
    };
    session.messages.push(assistantMessage);
    session.updatedAt = new Date();

    yield { type: 'done', data: { message: assistantMessage } };
  }

  getSession(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }
}
