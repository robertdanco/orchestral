import type { SlackChannel, SlackMessage } from '@orchestral/shared';

export class SlackCache {
  private channels: Map<string, SlackChannel> = new Map();
  private messages: Map<string, SlackMessage[]> = new Map(); // channelId -> messages
  private lastRefreshed: Date | null = null;

  getChannels(): SlackChannel[] {
    return Array.from(this.channels.values());
  }

  setChannels(channels: SlackChannel[]): void {
    this.channels.clear();
    channels.forEach(channel => this.channels.set(channel.id, channel));
    this.lastRefreshed = new Date();
  }

  getChannel(id: string): SlackChannel | undefined {
    return this.channels.get(id);
  }

  getChannelByName(name: string): SlackChannel | undefined {
    return Array.from(this.channels.values()).find(c => c.name === name);
  }

  getMessages(channelId: string): SlackMessage[] {
    return this.messages.get(channelId) || [];
  }

  getAllMessages(): SlackMessage[] {
    const all: SlackMessage[] = [];
    this.messages.forEach(msgs => all.push(...msgs));
    return all;
  }

  setMessages(channelId: string, messages: SlackMessage[]): void {
    this.messages.set(channelId, messages);
    this.lastRefreshed = new Date();
  }

  addMessages(channelId: string, messages: SlackMessage[]): void {
    const existing = this.messages.get(channelId) || [];
    const existingTs = new Set(existing.map(m => m.ts));
    const newMessages = messages.filter(m => !existingTs.has(m.ts));
    this.messages.set(channelId, [...existing, ...newMessages]);
    this.lastRefreshed = new Date();
  }

  getRecentMessages(sinceDays: number = 7): SlackMessage[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - sinceDays);
    const cutoffTs = cutoff.getTime();

    const all = this.getAllMessages();
    return all.filter(msg => new Date(msg.createdAt).getTime() >= cutoffTs);
  }

  searchCached(query: string): SlackMessage[] {
    const queryLower = query.toLowerCase();
    const all = this.getAllMessages();
    return all.filter(msg => msg.text.toLowerCase().includes(queryLower));
  }

  getLastRefreshed(): Date | null {
    return this.lastRefreshed;
  }

  clear(): void {
    this.channels.clear();
    this.messages.clear();
    this.lastRefreshed = null;
  }

  isEmpty(): boolean {
    return this.channels.size === 0 && this.messages.size === 0;
  }
}
