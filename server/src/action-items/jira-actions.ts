import type { JiraItem, JiraActionItem, ActionRequiredResult } from '@orchestral/shared';
import { detectActionRequired, DEFAULT_ACTION_CONFIG, type ActionConfig } from '../actions.js';

type JiraActionCategory = JiraActionItem['category'];

const CATEGORY_PRIORITY: Record<JiraActionCategory, JiraActionItem['priority']> = {
  blocker: 'high',
  blocked: 'high',
  stale: 'medium',
  missingDetails: 'low',
  unassigned: 'medium',
  unestimated: 'low',
};

function mapToJiraActionItem(
  item: JiraItem,
  reason: string,
  category: JiraActionCategory
): JiraActionItem {
  return {
    id: `jira-${item.key}-${category}`,
    source: 'jira',
    title: item.summary,
    reason,
    url: item.url,
    createdAt: item.created,
    priority: CATEGORY_PRIORITY[category],
    category,
    issueKey: item.key,
  };
}

export function detectJiraActions(
  issues: JiraItem[],
  config: ActionConfig = DEFAULT_ACTION_CONFIG
): JiraActionItem[] {
  const result: ActionRequiredResult = detectActionRequired(issues, config);
  const actionItems: JiraActionItem[] = [];

  // Map each category to JiraActionItem format
  const categories: Array<{ key: keyof ActionRequiredResult; category: JiraActionCategory }> = [
    { key: 'blockers', category: 'blocker' },
    { key: 'blocked', category: 'blocked' },
    { key: 'stale', category: 'stale' },
    { key: 'missingDetails', category: 'missingDetails' },
    { key: 'unassigned', category: 'unassigned' },
    { key: 'unestimated', category: 'unestimated' },
  ];

  for (const { key, category } of categories) {
    for (const { item, reason } of result[key]) {
      // Check if this item is already added (an item can appear in multiple categories)
      const existingIndex = actionItems.findIndex(
        a => a.issueKey === item.key && a.category === category
      );
      if (existingIndex === -1) {
        actionItems.push(mapToJiraActionItem(item, reason, category));
      }
    }
  }

  // Sort by priority (high first) then by created date (newest first)
  actionItems.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return actionItems;
}
