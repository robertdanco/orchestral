import { describe, it, expect, beforeEach } from 'vitest';
import { detectGoogleDocsActions } from './google-docs-actions.js';
import { GoogleDocsCache } from '../google/cache.js';
import type { GoogleDoc } from '@orchestral/shared';

describe('detectGoogleDocsActions', () => {
  let cache: GoogleDocsCache;
  const meetingNotesPattern = 'Meeting Notes.*|Transcript.*';

  const createMeetingDoc = (options: Partial<GoogleDoc> = {}): GoogleDoc => ({
    id: 'doc123',
    name: 'Meeting Notes 2024-01-15',
    webViewLink: 'https://docs.google.com/document/d/doc123',
    modifiedTime: new Date().toISOString(),
    content: `
# Meeting Notes

## Action Items
- @John: Complete the API design
- @Sarah: Review the documentation
- Follow up with the team

## Decisions
- Use TypeScript for the project
    `,
    folderName: 'Team Meetings',
    ...options,
  });

  beforeEach(() => {
    cache = new GoogleDocsCache();
  });

  it('returns empty array for empty cache', () => {
    const result = detectGoogleDocsActions(cache, meetingNotesPattern);
    expect(result).toEqual([]);
  });

  it('detects action items from meeting notes', () => {
    cache.setDocuments([createMeetingDoc()]);
    const result = detectGoogleDocsActions(cache, meetingNotesPattern);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].source).toBe('google-docs');
    expect(result[0].documentId).toBe('doc123');
  });

  it('ignores non-meeting documents', () => {
    cache.setDocuments([
      createMeetingDoc({ id: 'doc1', name: 'Design Spec', content: '# Action Items\n- Task 1' }),
    ]);
    const result = detectGoogleDocsActions(cache, meetingNotesPattern);
    expect(result).toEqual([]);
  });

  it('ignores documents without content', () => {
    cache.setDocuments([
      createMeetingDoc({ content: null }),
    ]);
    const result = detectGoogleDocsActions(cache, meetingNotesPattern);
    expect(result).toEqual([]);
  });

  it('assigns correct priorities to categories', () => {
    cache.setDocuments([createMeetingDoc()]);
    const result = detectGoogleDocsActions(cache, meetingNotesPattern);

    const tasks = result.filter(i => i.category === 'task');
    const decisions = result.filter(i => i.category === 'decision');
    const followups = result.filter(i => i.category === 'followup');

    if (tasks.length > 0) {
      expect(tasks[0].priority).toBe('high');
    }
    if (decisions.length > 0) {
      expect(decisions[0].priority).toBe('medium');
    }
    if (followups.length > 0) {
      expect(followups[0].priority).toBe('medium');
    }
  });

  it('extracts assignee from action items', () => {
    cache.setDocuments([createMeetingDoc()]);
    const result = detectGoogleDocsActions(cache, meetingNotesPattern);

    const johnItem = result.find(i => i.assignee === 'John');
    expect(johnItem).toBeDefined();
    expect(johnItem!.title).toContain('API design');
  });

  it('filters by current user email when provided', () => {
    cache.setDocuments([createMeetingDoc()]);

    // Filter for John's items only
    const johnResult = detectGoogleDocsActions(cache, meetingNotesPattern, 'john@example.com');
    expect(johnResult.some(i => i.assignee === 'John')).toBe(true);
    expect(johnResult.every(i => i.assignee === 'John' || i.assignee === null)).toBe(true);
  });

  it('includes items with no assignee for any user', () => {
    cache.setDocuments([createMeetingDoc()]);
    const result = detectGoogleDocsActions(cache, meetingNotesPattern, 'anyone@example.com');

    // Should include follow-up items that have no assignee
    const noAssigneeItems = result.filter(i => i.assignee === null);
    expect(noAssigneeItems.length).toBeGreaterThan(0);
  });

  it('generates unique IDs for each action item', () => {
    cache.setDocuments([createMeetingDoc()]);
    const result = detectGoogleDocsActions(cache, meetingNotesPattern);

    const ids = result.map(i => i.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('includes document metadata in action items', () => {
    cache.setDocuments([createMeetingDoc()]);
    const result = detectGoogleDocsActions(cache, meetingNotesPattern);

    expect(result[0].documentTitle).toBe('Meeting Notes 2024-01-15');
    expect(result[0].url).toBe('https://docs.google.com/document/d/doc123');
  });

  it('sorts action items by priority', () => {
    cache.setDocuments([createMeetingDoc()]);
    const result = detectGoogleDocsActions(cache, meetingNotesPattern);

    // High priority items should come first
    for (let i = 1; i < result.length; i++) {
      const prevPriority = result[i - 1].priority;
      const currPriority = result[i].priority;
      if (prevPriority !== currPriority) {
        expect(['high', 'medium', 'low'].indexOf(prevPriority))
          .toBeLessThanOrEqual(['high', 'medium', 'low'].indexOf(currPriority));
      }
    }
  });

  it('only processes recent documents', () => {
    const oldDoc = createMeetingDoc({
      id: 'oldDoc',
      modifiedTime: new Date('2020-01-01').toISOString(),
    });
    cache.setDocuments([oldDoc]);

    const result = detectGoogleDocsActions(cache, meetingNotesPattern);
    expect(result).toEqual([]);
  });
});
