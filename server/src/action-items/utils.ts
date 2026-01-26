import type { ActionItemBase } from '@orchestral/shared';

const PRIORITY_ORDER: Record<ActionItemBase['priority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function sortActionItems<T extends ActionItemBase>(items: T[]): void {
  items.sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Section in the action items response
 */
interface ActionItemSection<T> {
  items: T[];
  count: number;
  error?: string;
}

/**
 * Process a Promise.allSettled result and populate an action item section.
 * If fulfilled, sets items and count. If rejected, sets error message.
 */
export function processResult<T>(
  result: PromiseSettledResult<T[]>,
  section: ActionItemSection<T>,
  errorMessage: string
): void {
  if (result.status === 'fulfilled') {
    section.items = result.value;
    section.count = result.value.length;
  } else {
    section.error = result.reason?.message || errorMessage;
  }
}
