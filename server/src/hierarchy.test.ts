import { describe, it, expect } from 'vitest';
import { buildHierarchy } from './hierarchy.js';
import { JiraItem, HierarchicalJiraItem } from './types.js';

describe('buildHierarchy', () => {
  const makeItem = (key: string, type: string, parentKey: string | null): JiraItem => ({
    key,
    summary: `Issue ${key}`,
    type: type as JiraItem['type'],
    status: 'To Do',
    statusCategory: 'todo',
    assignee: null,
    parentKey,
    estimate: null,
    created: '2024-01-01T00:00:00Z',
    updated: '2024-01-01T00:00:00Z',
    labels: [],
    blocked: false,
    blockedReason: null,
    url: `https://test.atlassian.net/browse/${key}`,
  });

  it('builds three-level hierarchy', () => {
    const items: JiraItem[] = [
      makeItem('PROJ-1', 'initiative', null),
      makeItem('PROJ-10', 'epic', 'PROJ-1'),
      makeItem('PROJ-100', 'story', 'PROJ-10'),
      makeItem('PROJ-101', 'task', 'PROJ-10'),
    ];

    const result = buildHierarchy(items);

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('PROJ-1');
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].key).toBe('PROJ-10');
    expect(result[0].children[0].children).toHaveLength(2);
  });

  it('puts orphaned items at root level', () => {
    const items: JiraItem[] = [
      makeItem('PROJ-100', 'story', 'PROJ-999'), // parent doesn't exist
    ];

    const result = buildHierarchy(items);

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('PROJ-100');
  });

  it('handles items with no parent', () => {
    const items: JiraItem[] = [
      makeItem('PROJ-1', 'initiative', null),
      makeItem('PROJ-2', 'epic', null),
    ];

    const result = buildHierarchy(items);

    expect(result).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    expect(buildHierarchy([])).toEqual([]);
  });
});
