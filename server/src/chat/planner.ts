// Query planner - uses LLM to create execution plans

import type { LLMClient } from './llm/client.js';
import { buildPlannerPrompt } from './llm/prompts.js';
import type {
  KnowledgeSourceMetadata,
  QueryPlan,
  QueryPhase,
  SourceSelection,
} from './types.js';

export interface QueryPlannerOptions {
  llmClient: LLMClient;
}

export class QueryPlanner {
  private llmClient: LLMClient;

  constructor(options: QueryPlannerOptions) {
    this.llmClient = options.llmClient;
  }

  async createPlan(
    query: string,
    availableSources: KnowledgeSourceMetadata[]
  ): Promise<QueryPlan> {
    if (availableSources.length === 0) {
      return {
        phases: [],
        reasoning: 'No knowledge sources available',
      };
    }

    const systemPrompt = buildPlannerPrompt(availableSources);

    const response = await this.llmClient.complete({
      systemPrompt,
      messages: [{ role: 'user', content: query }],
      temperature: 0,
      maxTokens: 1024,
    });

    return this.parseResponse(response, availableSources);
  }

  private parseResponse(
    response: string,
    availableSources: KnowledgeSourceMetadata[]
  ): QueryPlan {
    try {
      // Extract JSON from response (handle potential markdown code blocks)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]) as QueryPlan;

      // Validate the plan
      return this.validatePlan(parsed, availableSources);
    } catch (error) {
      console.error('Failed to parse planner response:', error);
      console.error('Response was:', response);

      // Return a fallback plan that queries all sources in parallel
      return this.createFallbackPlan(availableSources);
    }
  }

  private validatePlan(
    plan: QueryPlan,
    availableSources: KnowledgeSourceMetadata[]
  ): QueryPlan {
    const sourceIds = new Set(availableSources.map((s) => s.id));

    const validatedPhases: QueryPhase[] = plan.phases
      .map((phase, idx) => {
        const validSources = phase.sources.filter((s) =>
          sourceIds.has(s.sourceId)
        );

        if (validSources.length === 0) {
          return null;
        }

        return {
          phase: idx + 1,
          sources: validSources,
          waitForPrevious: idx > 0,
        };
      })
      .filter((phase): phase is QueryPhase => phase !== null);

    return {
      phases: validatedPhases,
      reasoning: plan.reasoning || 'Plan created by query planner',
    };
  }

  private createFallbackPlan(
    sources: KnowledgeSourceMetadata[]
  ): QueryPlan {
    // Sort by priority and query all relevant sources in parallel
    const sortedSources = [...sources].sort((a, b) => a.priority - b.priority);

    const sourceSelections: SourceSelection[] = sortedSources.map((s) => ({
      sourceId: s.id,
      reason: 'Fallback: querying all available sources',
    }));

    return {
      phases: [
        {
          phase: 1,
          sources: sourceSelections,
          waitForPrevious: false,
        },
      ],
      reasoning: 'Fallback plan: querying all sources in parallel',
    };
  }
}
