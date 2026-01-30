import { describe, it, expect, beforeEach } from 'vitest';
import { Cache } from './cache.js';
import { JiraItem } from './types.js';

describe('Cache', () => {
  let cache: Cache;

  const mockItem: JiraItem = {
    key: 'PROJ-1',
    summary: 'Test',
    type: 'story',
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
    url: 'https://test.atlassian.net/browse/PROJ-1',
  };

  beforeEach(() => {
    cache = new Cache();
  });

  it('starts empty', () => {
    expect(cache.getIssues()).toEqual([]);
    expect(cache.getLastRefreshed()).toBeNull();
  });

  it('stores and retrieves issues', () => {
    cache.setIssues([mockItem]);
    expect(cache.getIssues()).toEqual([mockItem]);
  });

  it('tracks last refreshed time', () => {
    const before = Date.now();
    cache.setIssues([mockItem]);
    const after = Date.now();

    const refreshed = cache.getLastRefreshed();
    expect(refreshed).not.toBeNull();
    expect(refreshed!.getTime()).toBeGreaterThanOrEqual(before);
    expect(refreshed!.getTime()).toBeLessThanOrEqual(after);
  });

  it('clears cache', () => {
    cache.setIssues([mockItem]);
    cache.clear();
    expect(cache.getIssues()).toEqual([]);
    expect(cache.getLastRefreshed()).toBeNull();
  });

  it('gets single issue by key', () => {
    cache.setIssues([mockItem]);
    expect(cache.getIssue('PROJ-1')).toEqual(mockItem);
    expect(cache.getIssue('PROJ-999')).toBeUndefined();
  });
});
