import type { SlackActionItem, SlackActionCategory, SlackMessage } from '@orchestral/shared';
import type { SlackClient } from '../slack/client.js';
import type { SlackCache } from '../slack/cache.js';
import { sortActionItems } from './utils.js';

const CATEGORY_PRIORITY: Record<SlackActionCategory, SlackActionItem['priority']> = {
  'mention': 'high',
  'thread-reply': 'medium',
};

function mapToSlackActionItem(
  message: SlackMessage,
  category: SlackActionCategory,
  reason: string
): SlackActionItem {
  return {
    id: `slack-${message.channelId}-${message.ts}-${category}`,
    source: 'slack',
    title: truncateText(message.text, 80),
    reason,
    url: message.permalink,
    createdAt: message.createdAt,
    priority: CATEGORY_PRIORITY[category],
    category,
    channelId: message.channelId,
    channelName: message.channelName,
    messageTs: message.ts,
    threadTs: message.threadTs,
    authorId: message.userId,
    authorName: message.userName,
  };
}

function truncateText(text: string, maxLength: number): string {
  // Clean up Slack formatting
  const cleaned = text
    .replace(/<@[A-Z0-9]+>/g, '@user') // Replace user mentions with @user
    .replace(/<#[A-Z0-9]+\|([^>]+)>/g, '#$1') // Replace channel links with #channel
    .replace(/<([^|>]+)\|([^>]+)>/g, '$2') // Replace URL links with display text
    .replace(/<([^>]+)>/g, '$1') // Remove other formatting
    .replace(/\n/g, ' ')
    .trim();

  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength - 3) + '...';
}

export async function detectSlackActions(
  client: SlackClient,
  cache: SlackCache,
  currentUserId: string
): Promise<SlackActionItem[]> {
  const actionItems: SlackActionItem[] = [];
  const seenMessageIds = new Set<string>();

  try {
    // Get recent messages from cache (last 7 days)
    const recentMessages = cache.getRecentMessages(7);

    // If cache is empty, try to populate it
    if (recentMessages.length === 0) {
      const channels = cache.getChannels();
      if (channels.length === 0) {
        // Fetch channels first
        const fetchedChannels = await client.fetchChannels();
        cache.setChannels(fetchedChannels);
      }

      // Fetch recent messages for each channel
      for (const channel of cache.getChannels()) {
        try {
          const oldest = (Date.now() / 1000 - 7 * 24 * 60 * 60).toString();
          const messages = await client.fetchMessages(channel.id, { oldest, limit: 100 });
          cache.setMessages(channel.id, messages);
        } catch {
          // Skip channels we can't access
        }
      }
    }

    // Re-fetch recent messages after potential population
    const messages = cache.getRecentMessages(7);

    // Track threads started by current user for reply detection
    const userThreads = new Map<string, SlackMessage>(); // threadTs -> original message
    for (const message of messages) {
      if (message.userId === currentUserId && !message.threadTs) {
        // This is a top-level message by the current user
        userThreads.set(message.ts, message);
      }
    }

    for (const message of messages) {
      // Skip own messages
      if (message.userId === currentUserId) continue;

      // 1. Check for direct @mentions of current user
      if (message.mentions.includes(currentUserId)) {
        const key = `${message.ts}-mention`;
        if (!seenMessageIds.has(key)) {
          seenMessageIds.add(key);
          actionItems.push(
            mapToSlackActionItem(message, 'mention', `${message.userName} mentioned you in #${message.channelName}`)
          );
        }
      }

      // 2. Check for replies to threads started by current user
      if (message.threadTs && userThreads.has(message.threadTs)) {
        const key = `${message.ts}-thread-reply`;
        if (!seenMessageIds.has(key)) {
          seenMessageIds.add(key);
          actionItems.push(
            mapToSlackActionItem(message, 'thread-reply', `${message.userName} replied to your thread in #${message.channelName}`)
          );
        }
      }
    }

    sortActionItems(actionItems);

  } catch (error) {
    console.error('Error detecting Slack actions:', error);
  }

  return actionItems;
}
