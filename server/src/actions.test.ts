import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { detectActionRequired, type ActionConfig } from './actions.js';
import type { JiraItem } from './types.js';

describe('detectActionRequired', () => {
  const config: ActionConfig = {
    staleDays: 5,
    requireEstimates: true,
    enabledCategories: {
      blocker: true,
      blocked: true,
      stale: true,
      missingDetails: true,
      unassigned: true,
      unestimated: true,
    },
    statusMappings: {
      staleStatusCategories: ['inprogress'],
      unassignedStatusCategories: ['todo', 'inprogress'],
    },
  };

  const makeItem = (overrides: Partial<JiraItem>): JiraItem => ({
    key: 'PROJ-1',
    summary: 'Test issue',
    type: 'story',
    status: 'In Progress',
    statusCategory: 'inprogress',
    assignee: 'John',
    parentKey: null,
    estimate: 5,
    created: '2024-01-01T00:00:00Z',
    updated: new Date().toISOString(),
    labels: [],
    blocked: false,
    blockedReason: null,
    url: 'https://test.atlassian.net/browse/PROJ-1',
    ...overrides,
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-20T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('detects blocked items', () => {
    const items = [makeItem({ blocked: true, blockedReason: 'Waiting on API' })];
    const result = detectActionRequired(items, config);

    expect(result.blocked).toHaveLength(1);
    expect(result.blocked[0].reason).toBe('Blocked by Waiting on API');
  });

  it('detects blockers when blockedReason matches an issue key', () => {
    const blockerItem = makeItem({ key: 'PROJ-2', summary: 'API Task' });
    const blockedItem = makeItem({ key: 'PROJ-1', blocked: true, blockedReason: 'PROJ-2' });
    const result = detectActionRequired([blockerItem, blockedItem], config);

    expect(result.blockers).toHaveLength(1);
    expect(result.blockers[0].item.key).toBe('PROJ-2');
    expect(result.blockers[0].reason).toBe('Blocks [PROJ-1] Test issue');
    // Also check blocked item uses [ID] Title format
    expect(result.blocked[0].reason).toBe('Blocked by [PROJ-2] API Task');
  });

  it('detects blockers when blockedReason matches an issue summary', () => {
    const blockerItem = makeItem({ key: 'PROJ-2', summary: 'API Task' });
    const blockedItem = makeItem({ key: 'PROJ-1', blocked: true, blockedReason: 'API Task' });
    const result = detectActionRequired([blockerItem, blockedItem], config);

    expect(result.blockers).toHaveLength(1);
    expect(result.blockers[0].item.key).toBe('PROJ-2');
    expect(result.blockers[0].reason).toBe('Blocks [PROJ-1] Test issue');
  });

  it('does not list done items as blockers', () => {
    const blockerItem = makeItem({ key: 'PROJ-2', summary: 'API Task', statusCategory: 'done' });
    const blockedItem = makeItem({ key: 'PROJ-1', blocked: true, blockedReason: 'PROJ-2' });
    const result = detectActionRequired([blockerItem, blockedItem], config);

    expect(result.blockers).toHaveLength(0);
  });

  it('detects stale items', () => {
    const items = [makeItem({ updated: '2024-01-10T00:00:00Z' })]; // 10 days old
    const result = detectActionRequired(items, config);

    expect(result.stale).toHaveLength(1);
    expect(result.stale[0].reason).toContain('10 days');
  });

  it('does not flag recently updated items as stale', () => {
    const items = [makeItem({ updated: '2024-01-18T00:00:00Z' })]; // 2 days old
    const result = detectActionRequired(items, config);

    expect(result.stale).toHaveLength(0);
  });

  it('detects unassigned items', () => {
    const items = [makeItem({ assignee: null })];
    const result = detectActionRequired(items, config);

    expect(result.unassigned).toHaveLength(1);
  });

  it('does not flag done items as unassigned', () => {
    const items = [makeItem({ assignee: null, statusCategory: 'done' })];
    const result = detectActionRequired(items, config);

    expect(result.unassigned).toHaveLength(0);
  });

  it('detects unestimated stories', () => {
    const items = [makeItem({ estimate: null })];
    const result = detectActionRequired(items, config);

    expect(result.unestimated).toHaveLength(1);
  });

  it('does not flag tasks as unestimated', () => {
    const items = [makeItem({ type: 'task', estimate: null })];
    const result = detectActionRequired(items, config);

    expect(result.unestimated).toHaveLength(0);
  });

  describe('enabled categories', () => {
    it('skips blocked detection when category is disabled', () => {
      const disabledConfig: ActionConfig = {
        ...config,
        enabledCategories: { ...config.enabledCategories, blocked: false },
      };
      const items = [makeItem({ blocked: true, blockedReason: 'Waiting on API' })];
      const result = detectActionRequired(items, disabledConfig);

      expect(result.blocked).toHaveLength(0);
    });

    it('skips stale detection when category is disabled', () => {
      const disabledConfig: ActionConfig = {
        ...config,
        enabledCategories: { ...config.enabledCategories, stale: false },
      };
      const items = [makeItem({ updated: '2024-01-10T00:00:00Z' })];
      const result = detectActionRequired(items, disabledConfig);

      expect(result.stale).toHaveLength(0);
    });

    it('skips unassigned detection when category is disabled', () => {
      const disabledConfig: ActionConfig = {
        ...config,
        enabledCategories: { ...config.enabledCategories, unassigned: false },
      };
      const items = [makeItem({ assignee: null })];
      const result = detectActionRequired(items, disabledConfig);

      expect(result.unassigned).toHaveLength(0);
    });

    it('skips unestimated detection when category is disabled', () => {
      const disabledConfig: ActionConfig = {
        ...config,
        enabledCategories: { ...config.enabledCategories, unestimated: false },
      };
      const items = [makeItem({ estimate: null })];
      const result = detectActionRequired(items, disabledConfig);

      expect(result.unestimated).toHaveLength(0);
    });
  });

  describe('status mappings', () => {
    it('detects stale items in todo status when configured', () => {
      const todoStaleConfig: ActionConfig = {
        ...config,
        statusMappings: {
          ...config.statusMappings,
          staleStatusCategories: ['todo'],
        },
      };
      const items = [makeItem({ statusCategory: 'todo', updated: '2024-01-10T00:00:00Z' })];
      const result = detectActionRequired(items, todoStaleConfig);

      expect(result.stale).toHaveLength(1);
    });

    it('skips stale detection for statuses not in mapping', () => {
      // Config only checks inprogress for stale
      const items = [makeItem({ statusCategory: 'todo', updated: '2024-01-10T00:00:00Z' })];
      const result = detectActionRequired(items, config);

      expect(result.stale).toHaveLength(0);
    });

    it('detects unassigned only in configured status categories', () => {
      const inprogressOnlyConfig: ActionConfig = {
        ...config,
        statusMappings: {
          ...config.statusMappings,
          unassignedStatusCategories: ['inprogress'],
        },
      };

      // Todo items without assignee should NOT be flagged
      const todoItems = [makeItem({ statusCategory: 'todo', assignee: null })];
      const todoResult = detectActionRequired(todoItems, inprogressOnlyConfig);
      expect(todoResult.unassigned).toHaveLength(0);

      // Inprogress items without assignee SHOULD be flagged
      const inprogressItems = [makeItem({ statusCategory: 'inprogress', assignee: null })];
      const inprogressResult = detectActionRequired(inprogressItems, inprogressOnlyConfig);
      expect(inprogressResult.unassigned).toHaveLength(1);
    });
  });
});
