import type { JiraActionItem, ConfluenceActionItem } from '../../types';

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
