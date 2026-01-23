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
