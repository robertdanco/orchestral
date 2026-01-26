import type { JiraActionItem, ConfluenceActionItem, ManualActionItem, SlackActionItem, ActionItem } from '../../types';

export const JIRA_CATEGORY_LABELS: Record<JiraActionItem['category'], string> = {
  blocker: 'Blockers',
  blocked: 'Blocked',
  stale: 'Stale',
  missingDetails: 'Missing Details',
  unassigned: 'Unassigned',
  unestimated: 'Unestimated',
};

export const CONFLUENCE_CATEGORY_LABELS: Record<ConfluenceActionItem['category'], string> = {
  'mention': 'Mentions',
  'reply-needed': 'Replies Needed',
  'unresolved-comment': 'Unresolved Comments',
};

export const MANUAL_CATEGORY_LABELS: Record<ManualActionItem['category'], string> = {
  task: 'Tasks',
  followup: 'Follow-ups',
  decision: 'Decisions',
  reminder: 'Reminders',
};

export const SLACK_CATEGORY_LABELS: Record<SlackActionItem['category'], string> = {
  'mention': 'Mentions',
  'thread-reply': 'Thread Replies',
};

export function isJiraItem(item: ActionItem): item is JiraActionItem {
  return item.source === 'jira';
}

export function isConfluenceItem(item: ActionItem): item is ConfluenceActionItem {
  return item.source === 'confluence';
}

export function isManualItem(item: ActionItem): item is ManualActionItem {
  return item.source === 'manual';
}

export function isSlackItem(item: ActionItem): item is SlackActionItem {
  return item.source === 'slack';
}

export function groupByCategory<T extends { category: string }>(
  items: T[]
): Record<string, T[]> {
  return items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}
