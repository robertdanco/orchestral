// Confluence Pages knowledge source - queries cached Confluence pages

import { ConfluenceCache } from '../../confluence/cache.js';
import { ConfluenceClient } from '../../confluence/client.js';
import type { ConfluencePage } from '@orchestral/shared';
import type {
  KnowledgeSource,
  KnowledgeSourceMetadata,
  QueryContext,
  KnowledgeSourceResult,
  Citation,
  ConfluencePageCitation,
} from '../types.js';

export class ConfluencePagesSource implements KnowledgeSource {
  private cache: ConfluenceCache;
  private client: ConfluenceClient;

  metadata: KnowledgeSourceMetadata = {
    id: 'confluence-pages',
    name: 'Confluence Pages',
    description:
      'Confluence documentation pages including wikis, guides, and technical docs. Contains page titles, content excerpts, and hierarchy.',
    capabilities: [
      'Search documentation by keyword',
      'Find pages about specific topics',
      'List pages in a space',
      'Get documentation content',
    ],
    exampleQueries: [
      "What's in the docs about deployment?",
      'Find documentation on API usage',
      'What pages are in the DOCS space?',
      'Search for onboarding guide',
    ],
    priority: 2,
  };

  constructor(cache: ConfluenceCache, client: ConfluenceClient) {
    this.cache = cache;
    this.client = client;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async query(context: QueryContext): Promise<KnowledgeSourceResult> {
    const query = context.query.toLowerCase();

    // Try to search via API for better results
    try {
      const searchResults = await this.client.searchPages(context.query);
      if (searchResults.length > 0) {
        return this.formatSearchResults(searchResults);
      }
    } catch {
      // Fall back to cache-based search
    }

    // Cache-based search
    const pages = this.cache.getPages();
    const result = this.processQuery(query, pages);

    return {
      sourceId: this.metadata.id,
      data: result.data,
      citations: result.citations,
    };
  }

  private formatSearchResults(
    pages: ConfluencePage[]
  ): KnowledgeSourceResult {
    const citations: Citation[] = pages.map((page) =>
      this.createCitation(page)
    );

    return {
      sourceId: this.metadata.id,
      data: {
        count: pages.length,
        pages: pages.map((p) => ({
          id: p.id,
          title: p.title,
          spaceKey: p.spaceKey,
          excerpt: p.body?.slice(0, 200) || 'No content preview',
          url: p.url,
        })),
      },
      citations,
    };
  }

  private processQuery(
    query: string,
    pages: ConfluencePage[]
  ): { data: unknown; citations: Citation[] } {
    // Check for space-specific queries
    if (this.isSpaceQuery(query)) {
      return this.handleSpaceQuery(query, pages);
    }

    // Check for summary queries
    if (this.isSummaryQuery(query)) {
      return this.handleSummaryQuery(pages);
    }

    // Default: search by title and content
    return this.handleSearchQuery(query, pages);
  }

  private isSpaceQuery(query: string): boolean {
    const spaceKeywords = ['space', 'in space', 'from space'];
    return spaceKeywords.some((kw) => query.includes(kw));
  }

  private isSummaryQuery(query: string): boolean {
    const summaryKeywords = [
      'how many',
      'count',
      'list all',
      'overview',
      'summary',
    ];
    return summaryKeywords.some((kw) => query.includes(kw));
  }

  private handleSpaceQuery(
    query: string,
    pages: ConfluencePage[]
  ): { data: unknown; citations: Citation[] } {
    // Try to extract space key from query
    const spaceMatch = query.match(/(?:space|in|from)\s+([A-Z0-9]+)/i);
    const spaceKey = spaceMatch?.[1]?.toUpperCase();

    if (spaceKey) {
      const spacePages = pages.filter(
        (p) => p.spaceKey.toUpperCase() === spaceKey
      );
      const citations = spacePages.map((page) => this.createCitation(page));

      return {
        data: {
          spaceKey,
          count: spacePages.length,
          pages: spacePages.map((p) => ({
            id: p.id,
            title: p.title,
            excerpt: p.body?.slice(0, 200) || 'No content preview',
          })),
        },
        citations,
      };
    }

    // List pages grouped by space
    const bySpace = new Map<string, ConfluencePage[]>();
    for (const page of pages) {
      const key = page.spaceKey || 'Unknown';
      if (!bySpace.has(key)) {
        bySpace.set(key, []);
      }
      bySpace.get(key)!.push(page);
    }

    const grouped = Object.fromEntries(
      Array.from(bySpace.entries()).map(([key, spacePages]) => [
        key,
        {
          count: spacePages.length,
          pages: spacePages.slice(0, 5).map((p) => p.title),
        },
      ])
    );

    return {
      data: { pagesBySpace: grouped },
      citations: [],
    };
  }

  private handleSummaryQuery(
    pages: ConfluencePage[]
  ): { data: unknown; citations: Citation[] } {
    const spaces = this.cache.getSpaces();

    const bySpace = new Map<string, number>();
    for (const page of pages) {
      const key = page.spaceKey || 'Unknown';
      bySpace.set(key, (bySpace.get(key) || 0) + 1);
    }

    return {
      data: {
        totalSpaces: spaces.length,
        totalPages: pages.length,
        pagesBySpace: Object.fromEntries(bySpace),
      },
      citations: [],
    };
  }

  private handleSearchQuery(
    query: string,
    pages: ConfluencePage[]
  ): { data: unknown; citations: Citation[] } {
    // Search by title and content
    const queryTerms = query
      .split(/\s+/)
      .filter((term) => term.length > 2);

    const scored = pages
      .map((page) => {
        let score = 0;
        const titleLower = page.title.toLowerCase();
        const bodyLower = (page.body || '').toLowerCase();

        for (const term of queryTerms) {
          if (titleLower.includes(term)) score += 10;
          if (bodyLower.includes(term)) score += 1;
        }

        return { page, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const citations = scored.map((item) => this.createCitation(item.page));

    return {
      data: {
        count: scored.length,
        pages: scored.map((item) => ({
          id: item.page.id,
          title: item.page.title,
          spaceKey: item.page.spaceKey,
          excerpt: item.page.body?.slice(0, 200) || 'No content preview',
          relevance: item.score,
        })),
      },
      citations,
    };
  }

  private createCitation(page: ConfluencePage): ConfluencePageCitation {
    return {
      sourceId: this.metadata.id,
      type: 'confluence-page',
      id: page.id,
      title: page.title,
      url: page.url,
      snippet: page.body?.slice(0, 150) || 'No content preview',
      metadata: {
        pageId: page.id,
        spaceKey: page.spaceKey,
        title: page.title,
      },
    };
  }
}
