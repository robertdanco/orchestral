import type { JiraItem, JiraActionItem, ActionRequiredResult, JiraActionSettings } from '@orchestral/shared';
import { DEFAULT_JIRA_ACTION_SETTINGS } from '@orchestral/shared';
import { detectActionRequired } from '../actions.js';
import { sortActionItems } from './utils.js';

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
  settings: JiraActionSettings = DEFAULT_JIRA_ACTION_SETTINGS
): JiraActionItem[] {
  const result: ActionRequiredResult = detectActionRequired(issues, settings);
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

  sortActionItems(actionItems);

  return actionItems;
}
