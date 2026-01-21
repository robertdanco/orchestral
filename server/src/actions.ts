import { JiraItem } from './types.js';

export interface ActionConfig {
  staleDays: number;
  requireEstimates: boolean;
}

export interface ActionRequiredItem {
  item: JiraItem;
  reason: string;
}

export interface ActionRequiredResult {
  blocked: ActionRequiredItem[];
  stale: ActionRequiredItem[];
  missingDetails: ActionRequiredItem[];
  unassigned: ActionRequiredItem[];
  unestimated: ActionRequiredItem[];
}

export function detectActionRequired(
  items: JiraItem[],
  config: ActionConfig
): ActionRequiredResult {
  const result: ActionRequiredResult = {
    blocked: [],
    stale: [],
    missingDetails: [],
    unassigned: [],
    unestimated: [],
  };

  const now = new Date();
  const staleThreshold = config.staleDays * 24 * 60 * 60 * 1000;

  for (const item of items) {
    // Skip done items for most checks
    const isDone = item.statusCategory === 'done';

    // Blocked
    if (item.blocked) {
      result.blocked.push({
        item,
        reason: item.blockedReason || 'Marked as blocked',
      });
    }

    // Stale (in progress but not updated recently)
    if (item.statusCategory === 'inprogress') {
      const updatedAt = new Date(item.updated);
      const age = now.getTime() - updatedAt.getTime();
      if (age > staleThreshold) {
        const days = Math.floor(age / (24 * 60 * 60 * 1000));
        result.stale.push({
          item,
          reason: `No updates for ${days} days`,
        });
      }
    }

    // Unassigned (not done, in progress or todo)
    if (!isDone && !item.assignee) {
      result.unassigned.push({
        item,
        reason: 'No assignee',
      });
    }

    // Unestimated (stories only, if enabled)
    if (config.requireEstimates && item.type === 'story' && item.estimate === null) {
      result.unestimated.push({
        item,
        reason: 'Missing story points',
      });
    }
  }

  return result;
}
