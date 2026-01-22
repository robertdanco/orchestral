import type { JiraItem, ActionRequiredItem, ActionRequiredResult } from '@orchestral/shared';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface ActionConfig {
  staleDays: number;
  requireEstimates: boolean;
}

export const DEFAULT_ACTION_CONFIG: ActionConfig = {
  staleDays: 5,
  requireEstimates: true,
};

export function detectActionRequired(
  items: JiraItem[],
  config: ActionConfig
): ActionRequiredResult {
  const result: ActionRequiredResult = {
    blockers: [],
    blocked: [],
    stale: [],
    missingDetails: [],
    unassigned: [],
    unestimated: [],
  };

  // Build a map of issue keys and summaries to items for blocker detection
  const itemsByKey = new Map<string, JiraItem>();
  const itemsBySummary = new Map<string, JiraItem>();
  for (const item of items) {
    itemsByKey.set(item.key, item);
    itemsBySummary.set(item.summary, item);
  }

  const now = new Date();
  const staleThreshold = config.staleDays * MS_PER_DAY;

  for (const item of items) {
    // Skip done items for most checks
    const isDone = item.statusCategory === 'done';

    // Blocked
    if (item.blocked) {
      // Find the blocker issue if blockedReason matches a key or summary
      const blocker = item.blockedReason
        ? itemsByKey.get(item.blockedReason) || itemsBySummary.get(item.blockedReason)
        : null;

      // Format blocked reason with [ID] Title if blocker found
      let blockedReason = 'Marked as blocked';
      if (blocker) {
        blockedReason = `Blocked by [${blocker.key}] ${blocker.summary}`;
      } else if (item.blockedReason) {
        blockedReason = `Blocked by ${item.blockedReason}`;
      }

      result.blocked.push({
        item,
        reason: blockedReason,
      });

      // Add blocker to blockers list if found and not done
      if (blocker && blocker.statusCategory !== 'done') {
        const blockedRef = `[${item.key}] ${item.summary}`;
        const alreadyAdded = result.blockers.some(b => b.item.key === blocker.key);
        if (!alreadyAdded) {
          result.blockers.push({
            item: blocker,
            reason: `Blocks ${blockedRef}`,
          });
        } else {
          // Update existing blocker to show it blocks multiple items
          const existing = result.blockers.find(b => b.item.key === blocker.key);
          if (existing && !existing.reason.includes(item.key)) {
            existing.reason += `, ${blockedRef}`;
          }
        }
      }
    }

    // Stale (in progress but not updated recently)
    if (item.statusCategory === 'inprogress') {
      const updatedAt = new Date(item.updated);
      const age = now.getTime() - updatedAt.getTime();
      if (age > staleThreshold) {
        const days = Math.floor(age / (MS_PER_DAY));
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

// Re-export types for convenience
export type { ActionRequiredItem, ActionRequiredResult };
