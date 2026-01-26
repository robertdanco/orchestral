// Google Docs knowledge source - queries Google Docs

import type { GoogleDoc } from '@orchestral/shared';
import type { GoogleClient } from '../../google/client.js';
import type { GoogleDocsCache } from '../../google/cache.js';
import type {
  KnowledgeSource,
  KnowledgeSourceMetadata,
  QueryContext,
  KnowledgeSourceResult,
  Citation,
} from '../types.js';

export interface GoogleDocCitation extends Citation {
  type: 'document';
  metadata: {
    documentId: string;
    folderName: string | null;
  };
}

function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength).trim() + '...';
}

export class GoogleDocsSource implements KnowledgeSource {
  private client: GoogleClient;
  private cache: GoogleDocsCache;

  metadata: KnowledgeSourceMetadata = {
    id: 'google-docs',
    name: 'Google Docs',
    description:
      'Team documents from Google Drive including meeting notes, design docs, and other shared documents.',
    capabilities: [
      'Search documents by keyword',
      'Find documents about specific topics',
      'Search within meeting notes',
      'Find recent documents',
    ],
    exampleQueries: [
      'Find docs about API design',
      'What documents mention authentication?',
      'Recent meeting notes',
      'Search for design decisions',
    ],
    priority: 4, // Lower priority than Jira (1), Confluence (2), Slack (3)
  };

  constructor(client: GoogleClient, cache: GoogleDocsCache) {
    this.client = client;
    this.cache = cache;
  }

  async isAvailable(): Promise<boolean> {
    try {
      return await this.client.testConnection();
    } catch {
      return false;
    }
  }

  async query(context: QueryContext): Promise<KnowledgeSourceResult> {
    const query = context.query.toLowerCase();

    const result = await this.processQuery(query);

    return {
      sourceId: this.metadata.id,
      data: result.data,
      citations: result.citations,
    };
  }

  private async processQuery(
    query: string
  ): Promise<{ data: unknown; citations: Citation[] }> {
    // Check for meeting notes specific query
    if (this.isMeetingNotesQuery(query)) {
      return this.handleMeetingNotesQuery(query);
    }

    // Check for recent documents query
    if (this.isRecentQuery(query)) {
      return this.handleRecentQuery(query);
    }

    // Default: search documents
    return this.handleSearchQuery(query);
  }

  private isMeetingNotesQuery(query: string): boolean {
    const meetingKeywords = ['meeting notes', 'meeting', 'standup', 'sync', 'retro', 'retrospective', 'planning'];
    return meetingKeywords.some(kw => query.includes(kw));
  }

  private isRecentQuery(query: string): boolean {
    const recentKeywords = ['recent', 'latest', 'new', 'last week', 'this week'];
    return recentKeywords.some(kw => query.includes(kw));
  }

  private async handleMeetingNotesQuery(
    query: string
  ): Promise<{ data: unknown; citations: Citation[] }> {
    // First try cache
    let documents = this.cache.getMeetingNotes('Meeting Notes.*|Transcript.*');

    // If cache is empty, try to fetch
    if (documents.length === 0) {
      try {
        const fetched = await this.client.searchDocuments('Meeting Notes');
        documents = fetched;
      } catch {
        // Fall back to cached search
        documents = this.cache.searchCached(query);
      }
    }

    // Extract search terms (excluding meeting-specific words)
    const searchTerms = query
      .replace(/meeting\s*notes?|meeting|standup|sync|retro|retrospective|planning/gi, '')
      .trim();

    let filtered = documents;
    if (searchTerms) {
      filtered = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchTerms) ||
        doc.content?.toLowerCase().includes(searchTerms)
      );
    }

    // Limit results
    const results = filtered.slice(0, 15);
    const citations = results.map(doc => this.createCitation(doc));

    return {
      data: {
        type: 'meeting-notes',
        count: results.length,
        documents: results.map(d => ({
          name: d.name,
          modifiedTime: d.modifiedTime,
          folder: d.folderName,
          url: d.webViewLink,
          snippet: d.content ? truncateContent(d.content, 200) : null,
        })),
      },
      citations,
    };
  }

  private async handleRecentQuery(
    query: string
  ): Promise<{ data: unknown; citations: Citation[] }> {
    // Get recent documents from cache
    let documents = this.cache.getRecentDocuments(7);

    // If cache is empty, try to fetch
    if (documents.length === 0) {
      try {
        documents = await this.client.listDocuments();
      } catch {
        // Return empty result
        return { data: { type: 'recent', count: 0, documents: [] }, citations: [] };
      }
    }

    // Extract additional search terms
    const searchTerms = query
      .replace(/recent|latest|new|last\s*week|this\s*week/gi, '')
      .trim();

    let filtered = documents;
    if (searchTerms) {
      filtered = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchTerms) ||
        doc.content?.toLowerCase().includes(searchTerms)
      );
    }

    // Limit results
    const results = filtered.slice(0, 15);
    const citations = results.map(doc => this.createCitation(doc));

    return {
      data: {
        type: 'recent',
        count: results.length,
        documents: results.map(d => ({
          name: d.name,
          modifiedTime: d.modifiedTime,
          folder: d.folderName,
          url: d.webViewLink,
          snippet: d.content ? truncateContent(d.content, 200) : null,
        })),
      },
      citations,
    };
  }

  private async handleSearchQuery(
    query: string
  ): Promise<{ data: unknown; citations: Citation[] }> {
    let documents: GoogleDoc[] = [];

    // Try API search first
    try {
      documents = await this.client.searchDocuments(query);
    } catch {
      // Fall back to cache search
      documents = this.cache.searchCached(query);
    }

    // Limit results
    const results = documents.slice(0, 20);
    const citations = results.map(doc => this.createCitation(doc));

    return {
      data: {
        query,
        count: results.length,
        documents: results.map(d => ({
          name: d.name,
          modifiedTime: d.modifiedTime,
          folder: d.folderName,
          url: d.webViewLink,
          snippet: d.content ? truncateContent(d.content, 200) : null,
        })),
      },
      citations,
    };
  }

  private createCitation(doc: GoogleDoc): GoogleDocCitation {
    return {
      sourceId: this.metadata.id,
      type: 'document',
      id: `google-doc-${doc.id}`,
      title: doc.name,
      url: doc.webViewLink,
      snippet: doc.content ? truncateContent(doc.content, 100) : undefined,
      metadata: {
        documentId: doc.id,
        folderName: doc.folderName,
      },
    };
  }
}
