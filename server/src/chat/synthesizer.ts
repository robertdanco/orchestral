// Synthesizer - generates natural language responses from source results

import type { LLMClient } from './llm/client.js';
import { buildSynthesizerPrompt } from './llm/prompts.js';
import type {
  KnowledgeSourceResult,
  Citation,
  SynthesizedResponse,
} from './types.js';

export interface SynthesizerOptions {
  llmClient: LLMClient;
}

export class Synthesizer {
  private llmClient: LLMClient;

  constructor(options: SynthesizerOptions) {
    this.llmClient = options.llmClient;
  }

  async synthesize(
    query: string,
    results: KnowledgeSourceResult[],
    citations: Citation[]
  ): Promise<SynthesizedResponse> {
    // Build context from source results
    const sourceContext = this.buildSourceContext(results, citations);

    const systemPrompt = buildSynthesizerPrompt();
    const userMessage = this.buildUserMessage(query, sourceContext, citations);

    const content = await this.llmClient.complete({
      systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.3,
      maxTokens: 2048,
    });

    // Extract citations referenced in the response
    const referencedCitations = this.extractReferencedCitations(
      content,
      citations
    );

    return {
      content,
      citations: referencedCitations,
    };
  }

  async synthesizeStream(
    query: string,
    results: KnowledgeSourceResult[],
    citations: Citation[],
    onContent: (delta: string) => void
  ): Promise<SynthesizedResponse> {
    const sourceContext = this.buildSourceContext(results, citations);
    const systemPrompt = buildSynthesizerPrompt();
    const userMessage = this.buildUserMessage(query, sourceContext, citations);

    const content = await this.llmClient.stream({
      systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.3,
      maxTokens: 2048,
      onContent,
    });

    const referencedCitations = this.extractReferencedCitations(
      content,
      citations
    );

    return {
      content,
      citations: referencedCitations,
    };
  }

  private buildSourceContext(
    results: KnowledgeSourceResult[],
    citations: Citation[]
  ): string {
    const sections: string[] = [];

    for (const result of results) {
      if (result.error) {
        sections.push(
          `## Source: ${result.sourceId} (Error)\n${result.error}`
        );
        continue;
      }

      if (result.data) {
        sections.push(
          `## Source: ${result.sourceId}\n${JSON.stringify(result.data, null, 2)}`
        );
      }
    }

    // Add citation reference list
    if (citations.length > 0) {
      const citationList = citations
        .map(
          (c, idx) =>
            `[${idx + 1}] ${c.title} (${c.type}: ${c.id})${c.snippet ? ` - ${c.snippet}` : ''}`
        )
        .join('\n');

      sections.push(`## Available Citations\n${citationList}`);
    }

    return sections.join('\n\n');
  }

  private buildUserMessage(
    query: string,
    sourceContext: string,
    citations: Citation[]
  ): string {
    return `User Question: ${query}

${sourceContext}

Please provide a helpful response that answers the user's question.
Use citation markers [1], [2], etc. to reference specific items.
Available citation indices: 1 to ${citations.length}`;
  }

  private extractReferencedCitations(
    content: string,
    allCitations: Citation[]
  ): Citation[] {
    // Find all citation markers in the content like [1], [2], etc.
    const markerPattern = /\[(\d+)\]/g;
    const referencedIndices = new Set<number>();

    let match;
    while ((match = markerPattern.exec(content)) !== null) {
      const index = parseInt(match[1], 10) - 1; // Convert to 0-based
      if (index >= 0 && index < allCitations.length) {
        referencedIndices.add(index);
      }
    }

    // Return citations in order of their indices
    return Array.from(referencedIndices)
      .sort((a, b) => a - b)
      .map((idx) => allCitations[idx]);
  }
}
