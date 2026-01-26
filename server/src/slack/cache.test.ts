import { describe, it, expect, beforeEach } from 'vitest';
import { SlackCache } from './cache.js';
import type { SlackChannel, SlackMessage } from '@orchestral/shared';

describe('SlackCache', () => {
  let cache: SlackCache;

  const mockChannel: SlackChannel = {
    id: 'C12345',
    name: 'general',
    isPrivate: false,
  };

  const mockMessage: SlackMessage = {
    ts: '1234567890.123456',
    channelId: 'C12345',
    channelName: 'general',
    userId: 'U12345',
    userName: 'testuser',
    text: 'Hello world',
    permalink: 'https://slack.com/archives/C12345/p1234567890123456',
    threadTs: null,
    replyCount: 0,
    reactions: [],
    mentions: [],
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    cache = new SlackCache();
  });

  it('starts empty', () => {
    expect(cache.getChannels()).toEqual([]);
    expect(cache.getAllMessages()).toEqual([]);
    expect(cache.getLastRefreshed()).toBeNull();
    expect(cache.isEmpty()).toBe(true);
  });

  it('stores and retrieves channels', () => {
    cache.setChannels([mockChannel]);
    expect(cache.getChannels()).toEqual([mockChannel]);
    expect(cache.isEmpty()).toBe(false);
  });

  it('gets channel by id', () => {
    cache.setChannels([mockChannel]);
    expect(cache.getChannel('C12345')).toEqual(mockChannel);
    expect(cache.getChannel('C99999')).toBeUndefined();
  });

  it('gets channel by name', () => {
    cache.setChannels([mockChannel]);
    expect(cache.getChannelByName('general')).toEqual(mockChannel);
    expect(cache.getChannelByName('unknown')).toBeUndefined();
  });

  it('stores and retrieves messages by channel', () => {
    cache.setMessages('C12345', [mockMessage]);
    expect(cache.getMessages('C12345')).toEqual([mockMessage]);
    expect(cache.getMessages('C99999')).toEqual([]);
  });

  it('adds messages without duplicates', () => {
    cache.setMessages('C12345', [mockMessage]);
    const newMessage: SlackMessage = {
      ...mockMessage,
      ts: '1234567890.999999',
      text: 'Another message',
    };
    cache.addMessages('C12345', [mockMessage, newMessage]);
    const messages = cache.getMessages('C12345');
    expect(messages).toHaveLength(2);
  });

  it('gets all messages across channels', () => {
    cache.setMessages('C12345', [mockMessage]);
    const anotherMessage: SlackMessage = {
      ...mockMessage,
      channelId: 'C67890',
      ts: '9999999999.123456',
    };
    cache.setMessages('C67890', [anotherMessage]);
    expect(cache.getAllMessages()).toHaveLength(2);
  });

  it('gets recent messages within time window', () => {
    const recentMessage: SlackMessage = {
      ...mockMessage,
      createdAt: new Date().toISOString(),
    };
    const oldMessage: SlackMessage = {
      ...mockMessage,
      ts: '0000000001.123456',
      createdAt: new Date('2020-01-01').toISOString(),
    };
    cache.setMessages('C12345', [recentMessage, oldMessage]);

    const recent = cache.getRecentMessages(7);
    expect(recent).toHaveLength(1);
    expect(recent[0].ts).toBe(recentMessage.ts);
  });

  it('searches cached messages', () => {
    const matchingMessage: SlackMessage = {
      ...mockMessage,
      text: 'Important API discussion',
    };
    const nonMatchingMessage: SlackMessage = {
      ...mockMessage,
      ts: '9999999999.123456',
      text: 'Random chat',
    };
    cache.setMessages('C12345', [matchingMessage, nonMatchingMessage]);

    const results = cache.searchCached('API');
    expect(results).toHaveLength(1);
    expect(results[0].text).toContain('API');
  });

  it('tracks last refreshed time', () => {
    const before = Date.now();
    cache.setChannels([mockChannel]);
    const after = Date.now();

    const refreshed = cache.getLastRefreshed();
    expect(refreshed).not.toBeNull();
    expect(refreshed!.getTime()).toBeGreaterThanOrEqual(before);
    expect(refreshed!.getTime()).toBeLessThanOrEqual(after);
  });

  it('clears cache', () => {
    cache.setChannels([mockChannel]);
    cache.setMessages('C12345', [mockMessage]);
    cache.clear();

    expect(cache.getChannels()).toEqual([]);
    expect(cache.getAllMessages()).toEqual([]);
    expect(cache.getLastRefreshed()).toBeNull();
    expect(cache.isEmpty()).toBe(true);
  });
});
