import { describe, it, expect } from 'vitest';
import { isValidJiraItem, JiraItem } from './types.js';

describe('JiraItem type', () => {
  it('validates a complete JiraItem', () => {
    const item: JiraItem = {
      key: 'PROJ-123',
      summary: 'Test issue',
      type: 'story',
      status: 'In Progress',
      statusCategory: 'inprogress',
      displayStatus: 'in-progress',
      assignee: 'John Doe',
      parentKey: 'PROJ-100',
      estimate: 5,
      created: '2024-01-01T00:00:00Z',
      updated: '2024-01-15T00:00:00Z',
      labels: ['frontend'],
      blocked: false,
      blockedReason: null,
      url: 'https://company.atlassian.net/browse/PROJ-123',
    };
    expect(isValidJiraItem(item)).toBe(true);
  });

  it('validates item with null optional fields', () => {
    const item: JiraItem = {
      key: 'PROJ-124',
      summary: 'Minimal issue',
      type: 'task',
      status: 'To Do',
      statusCategory: 'todo',
      displayStatus: 'backlog',
      assignee: null,
      parentKey: null,
      estimate: null,
      created: '2024-01-01T00:00:00Z',
      updated: '2024-01-01T00:00:00Z',
      labels: [],
      blocked: false,
      blockedReason: null,
      url: 'https://company.atlassian.net/browse/PROJ-124',
    };
    expect(isValidJiraItem(item)).toBe(true);
  });

  it('rejects item missing required fields', () => {
    const item = { key: 'PROJ-125' };
    expect(isValidJiraItem(item)).toBe(false);
  });
});
