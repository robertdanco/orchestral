import type { SlackChannel, SlackMessage, SlackReaction, SlackUser } from '@orchestral/shared';

export interface SlackClientConfig {
  botToken: string;
  channelIds?: string[];
}

interface SlackApiConversation {
  id: string;
  name: string;
  is_private: boolean;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  is_mpim: boolean;
}

interface SlackApiMessage {
  ts: string;
  user?: string;
  text: string;
  thread_ts?: string;
  reply_count?: number;
  reactions?: Array<{
    name: string;
    count: number;
    users: string[];
  }>;
}

interface SlackApiUser {
  id: string;
  name: string;
  real_name: string;
  profile?: {
    email?: string;
    display_name?: string;
  };
}

interface SlackApiResponse {
  ok: boolean;
  error?: string;
}

interface ConversationsListResponse extends SlackApiResponse {
  channels: SlackApiConversation[];
  response_metadata?: { next_cursor?: string };
}

interface ConversationsHistoryResponse extends SlackApiResponse {
  messages: SlackApiMessage[];
  has_more?: boolean;
  response_metadata?: { next_cursor?: string };
}

interface UsersInfoResponse extends SlackApiResponse {
  user: SlackApiUser;
}

interface AuthTestResponse extends SlackApiResponse {
  user_id: string;
  user: string;
  team: string;
  team_id: string;
}

interface SearchMessagesResponse extends SlackApiResponse {
  messages: {
    matches: Array<{
      ts: string;
      channel: { id: string; name: string };
      user: string;
      username?: string;
      text: string;
      permalink: string;
      thread_ts?: string;
    }>;
    pagination?: { next_cursor?: string };
  };
}

interface ChatPermalinkResponse extends SlackApiResponse {
  permalink: string;
}

export class SlackClient {
  private botToken: string;
  private channelIds: string[];
  private userCache: Map<string, SlackUser> = new Map();

  constructor(config: SlackClientConfig) {
    if (!config.botToken) throw new Error('SLACK_BOT_TOKEN is required');

    this.botToken = config.botToken;
    this.channelIds = config.channelIds || [];
  }

  private getAuthHeader(): string {
    return `Bearer ${this.botToken}`;
  }

  getChannelIds(): string[] {
    return this.channelIds;
  }

  private async fetchApi<T extends SlackApiResponse>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<T> {
    const url = new URL(`https://slack.com/api/${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      throw new Error(`Slack API HTTP error: ${response.status}`);
    }

    const data = await response.json() as T;

    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error || 'unknown error'}`);
    }

    return data;
  }

  async getCurrentUser(): Promise<{ userId: string; userName: string }> {
    const data = await this.fetchApi<AuthTestResponse>('auth.test');
    return { userId: data.user_id, userName: data.user };
  }

  async fetchChannels(): Promise<SlackChannel[]> {
    const channels: SlackChannel[] = [];
    let cursor: string | undefined;

    do {
      const params: Record<string, string> = {
        types: 'public_channel,private_channel',
        limit: '200',
        exclude_archived: 'true',
      };
      if (cursor) params.cursor = cursor;

      const data = await this.fetchApi<ConversationsListResponse>('conversations.list', params);

      for (const channel of data.channels) {
        // Skip DMs and MPIMs, only include channels and groups
        if (channel.is_im || channel.is_mpim) continue;

        // If channelIds filter is set, only include those channels
        if (this.channelIds.length > 0 && !this.channelIds.includes(channel.id)) {
          continue;
        }

        channels.push({
          id: channel.id,
          name: channel.name,
          isPrivate: channel.is_private || channel.is_group,
        });
      }

      cursor = data.response_metadata?.next_cursor;
    } while (cursor);

    return channels;
  }

  async fetchMessages(channelId: string, options: {
    oldest?: string;
    latest?: string;
    limit?: number;
  } = {}): Promise<SlackMessage[]> {
    const messages: SlackMessage[] = [];
    let cursor: string | undefined;
    const limit = options.limit || 100;

    // Get channel info for name
    const channelName = await this.getChannelName(channelId);

    do {
      const params: Record<string, string> = {
        channel: channelId,
        limit: Math.min(limit - messages.length, 200).toString(),
      };
      if (options.oldest) params.oldest = options.oldest;
      if (options.latest) params.latest = options.latest;
      if (cursor) params.cursor = cursor;

      const data = await this.fetchApi<ConversationsHistoryResponse>('conversations.history', params);

      for (const msg of data.messages) {
        if (!msg.user) continue; // Skip bot messages without user

        const user = await this.fetchUser(msg.user);
        const permalink = await this.getPermalink(channelId, msg.ts);
        const mentions = this.extractMentions(msg.text);

        messages.push({
          ts: msg.ts,
          channelId,
          channelName,
          userId: msg.user,
          userName: user?.realName || user?.name || msg.user,
          text: msg.text,
          permalink,
          threadTs: msg.thread_ts || null,
          replyCount: msg.reply_count || 0,
          reactions: this.mapReactions(msg.reactions),
          mentions,
          createdAt: new Date(parseFloat(msg.ts) * 1000).toISOString(),
        });

        if (messages.length >= limit) break;
      }

      cursor = data.has_more ? data.response_metadata?.next_cursor : undefined;
    } while (cursor && messages.length < limit);

    return messages;
  }

  async searchMessages(query: string, options: {
    count?: number;
    sort?: 'timestamp' | 'score';
  } = {}): Promise<SlackMessage[]> {
    const params: Record<string, string> = {
      query,
      count: (options.count || 50).toString(),
      sort: options.sort || 'timestamp',
    };

    const data = await this.fetchApi<SearchMessagesResponse>('search.messages', params);

    const messages: SlackMessage[] = [];

    for (const match of data.messages.matches) {
      const user = await this.fetchUser(match.user);
      const mentions = this.extractMentions(match.text);

      messages.push({
        ts: match.ts,
        channelId: match.channel.id,
        channelName: match.channel.name,
        userId: match.user,
        userName: user?.realName || match.username || match.user,
        text: match.text,
        permalink: match.permalink,
        threadTs: match.thread_ts || null,
        replyCount: 0,
        reactions: [],
        mentions,
        createdAt: new Date(parseFloat(match.ts) * 1000).toISOString(),
      });
    }

    return messages;
  }

  async fetchUser(userId: string): Promise<SlackUser | null> {
    // Check cache first
    const cached = this.userCache.get(userId);
    if (cached) return cached;

    try {
      const data = await this.fetchApi<UsersInfoResponse>('users.info', { user: userId });

      const user: SlackUser = {
        id: data.user.id,
        name: data.user.name,
        realName: data.user.real_name || data.user.profile?.display_name || data.user.name,
        email: data.user.profile?.email,
      };

      this.userCache.set(userId, user);
      return user;
    } catch {
      return null;
    }
  }

  private async getChannelName(channelId: string): Promise<string> {
    try {
      interface ConversationsInfoResponse extends SlackApiResponse {
        channel: { name: string };
      }
      const data = await this.fetchApi<ConversationsInfoResponse>('conversations.info', {
        channel: channelId,
      });
      return data.channel.name;
    } catch {
      return channelId;
    }
  }

  private async getPermalink(channelId: string, messageTs: string): Promise<string> {
    try {
      const data = await this.fetchApi<ChatPermalinkResponse>('chat.getPermalink', {
        channel: channelId,
        message_ts: messageTs,
      });
      return data.permalink;
    } catch {
      // Construct a fallback permalink
      return `https://slack.com/archives/${channelId}/p${messageTs.replace('.', '')}`;
    }
  }

  private mapReactions(reactions?: Array<{ name: string; count: number; users: string[] }>): SlackReaction[] {
    if (!reactions) return [];
    return reactions.map(r => ({
      name: r.name,
      count: r.count,
      users: r.users,
    }));
  }

  private extractMentions(text: string): string[] {
    // Extract user IDs from <@U12345> format
    const mentionMatches = text.match(/<@([A-Z0-9]+)>/g) || [];
    return mentionMatches.map(m => m.replace(/<@|>/g, ''));
  }
}
