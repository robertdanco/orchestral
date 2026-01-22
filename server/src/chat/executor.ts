// Execution engine - executes query plans against knowledge sources

import type {
  KnowledgeSource,
  QueryPlan,
  QueryContext,
  KnowledgeSourceResult,
  ExecutionResult,
  Citation,
} from './types.js';

export interface ExecutionEngineOptions {
  sources: Map<string, KnowledgeSource>;
  onSourceStart?: (sourceId: string) => void;
  onSourceComplete?: (sourceId: string, result: KnowledgeSourceResult) => void;
}

export class ExecutionEngine {
  private sources: Map<string, KnowledgeSource>;
  private onSourceStart?: (sourceId: string) => void;
  private onSourceComplete?: (sourceId: string, result: KnowledgeSourceResult) => void;

  constructor(options: ExecutionEngineOptions) {
    this.sources = options.sources;
    this.onSourceStart = options.onSourceStart;
    this.onSourceComplete = options.onSourceComplete;
  }

  async execute(
    plan: QueryPlan,
    baseContext: QueryContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const allResults: KnowledgeSourceResult[] = [];
    const allCitations: Citation[] = [];
    const phaseTimings: { phase: number; durationMs: number }[] = [];

    let previousResults: KnowledgeSourceResult[] = [];

    for (const phase of plan.phases) {
      const phaseStart = Date.now();

      // Build context for this phase
      const phaseContext: QueryContext = {
        ...baseContext,
        previousResults: phase.waitForPrevious ? previousResults : undefined,
      };

      // Execute all sources in this phase in parallel
      const phaseResults = await Promise.all(
        phase.sources.map(async (selection) => {
          const source = this.sources.get(selection.sourceId);
          if (!source) {
            return {
              sourceId: selection.sourceId,
              data: null,
              citations: [],
              error: `Source ${selection.sourceId} not found`,
            };
          }

          this.onSourceStart?.(selection.sourceId);

          try {
            const contextWithFilters: QueryContext = {
              ...phaseContext,
              filters: selection.filters,
            };

            const result = await source.query(contextWithFilters);
            this.onSourceComplete?.(selection.sourceId, result);
            return result;
          } catch (error) {
            const errorResult: KnowledgeSourceResult = {
              sourceId: selection.sourceId,
              data: null,
              citations: [],
              error: error instanceof Error ? error.message : String(error),
            };
            this.onSourceComplete?.(selection.sourceId, errorResult);
            return errorResult;
          }
        })
      );

      // Collect results and citations
      for (const result of phaseResults) {
        allResults.push(result);
        allCitations.push(...result.citations);
      }

      previousResults = phaseResults;

      phaseTimings.push({
        phase: phase.phase,
        durationMs: Date.now() - phaseStart,
      });
    }

    return {
      results: allResults,
      citations: allCitations,
      timing: {
        startTime,
        endTime: Date.now(),
        phaseTimings,
      },
    };
  }
}
