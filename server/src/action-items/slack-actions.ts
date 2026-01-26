import type { SlackActionItem, SlackActionCategory, SlackMessage } from '@orchestral/shared';
import type { SlackCache } from '../slack/cache.js';
import { sortActionItems } from './utils.js';
import { truncateSlackText } from '../slack/utils.js';

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
    title: truncateSlackText(message.text, 80),
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

export function detectSlackActions(
  cache: SlackCache,
  currentUserId: string
): SlackActionItem[] {
  const actionItems: SlackActionItem[] = [];
  const seenMessageIds = new Set<string>();

  const messages = cache.getRecentMessages(7);

  // Track threads started by current user for reply detection
  const userThreads = new Map<string, SlackMessage>();
  for (const message of messages) {
    if (message.userId === currentUserId && !message.threadTs) {
      userThreads.set(message.ts, message);
    }
  }

  for (const message of messages) {
    if (message.userId === currentUserId) continue;

    // Check for direct @mentions of current user
    if (message.mentions.includes(currentUserId)) {
      const key = `${message.ts}-mention`;
      if (!seenMessageIds.has(key)) {
        seenMessageIds.add(key);
        actionItems.push(
          mapToSlackActionItem(message, 'mention', `${message.userName} mentioned you in #${message.channelName}`)
        );
      }
    }

    // Check for replies to threads started by current user
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

  return actionItems;
}
