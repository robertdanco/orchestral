import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { detectActionRequired, ActionRequiredItem, ActionConfig } from './actions.js';
import { JiraItem } from './types.js';

describe('detectActionRequired', () => {
  const config: ActionConfig = {
    staleDays: 5,
    requireEstimates: true,
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
    expect(result.blocked[0].reason).toBe('Waiting on API');
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
});
