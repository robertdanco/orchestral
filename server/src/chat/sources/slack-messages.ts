// Slack Messages knowledge source - queries Slack messages

import type { SlackMessage } from '@orchestral/shared';
import type { SlackClient } from '../../slack/client.js';
import type { SlackCache } from '../../slack/cache.js';
import type {
  KnowledgeSource,
  KnowledgeSourceMetadata,
  QueryContext,
  KnowledgeSourceResult,
  Citation,
} from '../types.js';

export interface SlackMessageCitation extends Citation {
  type: 'custom';
  metadata: {
    messageTs: string;
    channelId: string;
    channelName: string;
    authorName: string;
  };
}

export class SlackMessagesSource implements KnowledgeSource {
  private client: SlackClient;
  private cache: SlackCache;

  metadata: KnowledgeSourceMetadata = {
    id: 'slack-messages',
    name: 'Slack Messages',
    description:
      'Team discussions from Slack channels. Contains messages, threads, mentions, and reactions.',
    capabilities: [
      'Search messages by keyword',
      'Find discussions about specific topics',
      'Find messages in a specific channel',
      'Find recent messages from a user',
      'Get channel activity overview',
    ],
    exampleQueries: [
      'What was discussed about the API?',
      'Messages in #engineering',
      'What did John say about the release?',
      'Recent discussions about deployment',
      'Find slack conversations about the bug',
    ],
    priority: 3, // Lower priority than Jira (1) and Confluence (2)
  };

  constructor(client: SlackClient, cache: SlackCache) {
    this.client = client;
    this.cache = cache;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async query(context: QueryContext): Promise<KnowledgeSourceResult> {
    const query = context.query.toLowerCase();

    // Try to search via API first, then fall back to cache
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
    // Check for channel-specific query
    const channelMatch = query.match(/#(\w+)/);
    if (channelMatch) {
      return this.handleChannelQuery(channelMatch[1], query);
    }

    // Check for user-specific query
    if (this.isUserQuery(query)) {
      return this.handleUserQuery(query);
    }

    // Default: search messages
    return this.handleSearchQuery(query);
  }

  private isUserQuery(query: string): boolean {
    const userKeywords = ['said', 'from', 'by', 'posted by', "user's", 'their'];
    return userKeywords.some((kw) => query.includes(kw));
  }

  private async handleChannelQuery(
    channelName: string,
    query: string
  ): Promise<{ data: unknown; citations: Citation[] }> {
    // Try to find channel by name
    const channel = this.cache.getChannelByName(channelName);

    if (!channel) {
      // Try API search as fallback
      return this.handleSearchQuery(`in:#${channelName} ${query}`);
    }

    // Get messages from that channel
    const messages = this.cache.getMessages(channel.id);

    // Extract search terms (excluding channel reference)
    const searchTerms = query
      .replace(/#\w+/g, '')
      .trim()
      .toLowerCase();

    let filtered = messages;
    if (searchTerms) {
      filtered = messages.filter((m) =>
        m.text.toLowerCase().includes(searchTerms)
      );
    }

    // Limit results
    const results = filtered.slice(0, 20);
    const citations = results.map((msg) => this.createCitation(msg));

    return {
      data: {
        channel: channelName,
        count: results.length,
        messages: results.map((m) => ({
          author: m.userName,
          text: this.truncateText(m.text, 200),
          timestamp: m.createdAt,
          permalink: m.permalink,
          replyCount: m.replyCount,
        })),
      },
      citations,
    };
  }

  private async handleUserQuery(
    query: string
  ): Promise<{ data: unknown; citations: Citation[] }> {
    // Try to extract user name from query
    const nameMatch = query.match(
      /(?:said|from|by|posted by)\s+(\w+)/i
    );
    const userName = nameMatch?.[1]?.toLowerCase();

    if (!userName) {
      return this.handleSearchQuery(query);
    }

    const allMessages = this.cache.getAllMessages();
    const filtered = allMessages.filter(
      (m) =>
        m.userName.toLowerCase().includes(userName)
    );

    // Sort by recency
    filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const results = filtered.slice(0, 20);
    const citations = results.map((msg) => this.createCitation(msg));

    return {
      data: {
        user: userName,
        count: results.length,
        messages: results.map((m) => ({
          channel: m.channelName,
          text: this.truncateText(m.text, 200),
          timestamp: m.createdAt,
          permalink: m.permalink,
        })),
      },
      citations,
    };
  }

  private async handleSearchQuery(
    query: string
  ): Promise<{ data: unknown; citations: Citation[] }> {
    let messages: SlackMessage[] = [];

    // Try API search first
    try {
      messages = await this.client.searchMessages(query, { count: 20 });
    } catch {
      // Fall back to cache search
      messages = this.cache.searchCached(query).slice(0, 20);
    }

    const citations = messages.map((msg) => this.createCitation(msg));

    return {
      data: {
        query,
        count: messages.length,
        messages: messages.map((m) => ({
          channel: m.channelName,
          author: m.userName,
          text: this.truncateText(m.text, 200),
          timestamp: m.createdAt,
          permalink: m.permalink,
          replyCount: m.replyCount,
        })),
      },
      citations,
    };
  }

  private createCitation(message: SlackMessage): SlackMessageCitation {
    return {
      sourceId: this.metadata.id,
      type: 'custom',
      id: `slack-${message.channelId}-${message.ts}`,
      title: `Message in #${message.channelName}`,
      url: message.permalink,
      snippet: `${message.userName}: ${this.truncateText(message.text, 100)}`,
      metadata: {
        messageTs: message.ts,
        channelId: message.channelId,
        channelName: message.channelName,
        authorName: message.userName,
      },
    };
  }

  private truncateText(text: string, maxLength: number): string {
    // Clean up Slack formatting
    const cleaned = text
      .replace(/<@[A-Z0-9]+>/g, '@user')
      .replace(/<#[A-Z0-9]+\|([^>]+)>/g, '#$1')
      .replace(/<([^|>]+)\|([^>]+)>/g, '$2')
      .replace(/<([^>]+)>/g, '$1')
      .replace(/\n/g, ' ')
      .trim();

    if (cleaned.length <= maxLength) return cleaned;
    return cleaned.slice(0, maxLength - 3) + '...';
  }
}
