import { describe, it, expect, beforeEach, vi } from 'vitest';
import { detectSlackActions } from './slack-actions.js';
import { SlackCache } from '../slack/cache.js';
import type { SlackClient } from '../slack/client.js';
import type { SlackMessage, SlackChannel } from '@orchestral/shared';

describe('detectSlackActions', () => {
  let mockClient: SlackClient;
  let cache: SlackCache;
  const currentUserId = 'U_CURRENT';

  const createMessage = (overrides: Partial<SlackMessage> = {}): SlackMessage => ({
    ts: '1234567890.123456',
    channelId: 'C12345',
    channelName: 'general',
    userId: 'U_OTHER',
    userName: 'otheruser',
    text: 'Hello world',
    permalink: 'https://slack.com/archives/C12345/p1234567890123456',
    threadTs: null,
    replyCount: 0,
    reactions: [],
    mentions: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  });

  const mockChannel: SlackChannel = {
    id: 'C12345',
    name: 'general',
    isPrivate: false,
  };

  beforeEach(() => {
    cache = new SlackCache();
    cache.setChannels([mockChannel]);

    mockClient = {
      fetchChannels: vi.fn().mockResolvedValue([mockChannel]),
      fetchMessages: vi.fn().mockResolvedValue([]),
      getCurrentUser: vi.fn().mockResolvedValue({ userId: currentUserId, userName: 'currentuser' }),
    } as unknown as SlackClient;
  });

  it('returns empty array when cache is empty', async () => {
    const actions = await detectSlackActions(mockClient, cache, currentUserId);
    expect(actions).toEqual([]);
  });

  it('detects direct mentions of current user', async () => {
    const mentionMessage = createMessage({
      mentions: [currentUserId],
      text: `Hey <@${currentUserId}>, can you review this?`,
    });
    cache.setMessages('C12345', [mentionMessage]);

    const actions = await detectSlackActions(mockClient, cache, currentUserId);

    expect(actions).toHaveLength(1);
    expect(actions[0].category).toBe('mention');
    expect(actions[0].priority).toBe('high');
    expect(actions[0].authorName).toBe('otheruser');
  });

  it('detects replies to threads started by current user', async () => {
    const originalMessage = createMessage({
      ts: '1234567890.000001',
      userId: currentUserId,
      userName: 'currentuser',
      threadTs: null,
    });
    const replyMessage = createMessage({
      ts: '1234567890.000002',
      userId: 'U_OTHER',
      threadTs: '1234567890.000001',
      text: 'I can help with that!',
    });
    cache.setMessages('C12345', [originalMessage, replyMessage]);

    const actions = await detectSlackActions(mockClient, cache, currentUserId);

    expect(actions).toHaveLength(1);
    expect(actions[0].category).toBe('thread-reply');
    expect(actions[0].priority).toBe('medium');
  });

  it('ignores messages from current user', async () => {
    const ownMessage = createMessage({
      userId: currentUserId,
      mentions: [currentUserId], // Even if user mentions themselves
    });
    cache.setMessages('C12345', [ownMessage]);

    const actions = await detectSlackActions(mockClient, cache, currentUserId);

    expect(actions).toEqual([]);
  });

  it('deduplicates action items', async () => {
    const message = createMessage({
      mentions: [currentUserId],
    });
    // Add same message twice
    cache.setMessages('C12345', [message, message]);

    const actions = await detectSlackActions(mockClient, cache, currentUserId);

    expect(actions).toHaveLength(1);
  });

  it('sorts actions by priority then date', async () => {
    // Create dates within the 7-day window
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const olderMention = createMessage({
      ts: '1000000000.000001',
      mentions: [currentUserId],
      createdAt: twoDaysAgo.toISOString(),
    });
    const newerMention = createMessage({
      ts: '2000000000.000001',
      mentions: [currentUserId],
      createdAt: oneDayAgo.toISOString(),
    });
    cache.setMessages('C12345', [olderMention, newerMention]);

    const actions = await detectSlackActions(mockClient, cache, currentUserId);

    // Both are high priority (mentions), so should be sorted by date (newest first)
    expect(actions).toHaveLength(2);
    expect(actions[0].createdAt).toBe(newerMention.createdAt);
    expect(actions[1].createdAt).toBe(olderMention.createdAt);
  });

  it('creates proper action item structure', async () => {
    const message = createMessage({
      mentions: [currentUserId],
    });
    cache.setMessages('C12345', [message]);

    const actions = await detectSlackActions(mockClient, cache, currentUserId);

    expect(actions[0]).toMatchObject({
      source: 'slack',
      category: 'mention',
      channelId: 'C12345',
      channelName: 'general',
      messageTs: message.ts,
      authorId: 'U_OTHER',
      authorName: 'otheruser',
      url: message.permalink,
    });
    expect(actions[0].id).toContain('slack-');
    expect(actions[0].id).toContain('mention');
  });
});
