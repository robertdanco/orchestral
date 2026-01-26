import { describe, it, expect } from 'vitest';
import { parseMeetingNotes, isMeetingNote, extractMeetingDate } from './parser.js';

describe('isMeetingNote', () => {
  it('matches meeting notes pattern', () => {
    expect(isMeetingNote('Meeting Notes 2024-01-15', 'Meeting Notes.*')).toBe(true);
    expect(isMeetingNote('Transcript 2024-01-15', 'Meeting Notes.*|Transcript.*')).toBe(true);
  });

  it('does not match non-meeting files', () => {
    expect(isMeetingNote('Design Spec', 'Meeting Notes.*')).toBe(false);
    expect(isMeetingNote('API Documentation', 'Meeting Notes.*|Transcript.*')).toBe(false);
  });

  it('handles case insensitivity', () => {
    expect(isMeetingNote('meeting notes 2024-01-15', 'Meeting Notes.*')).toBe(true);
  });
});

describe('extractMeetingDate', () => {
  it('extracts ISO date from title', () => {
    expect(extractMeetingDate('Meeting Notes 2024-01-15', '')).toBe('2024-01-15');
  });

  it('extracts date with dots from title', () => {
    expect(extractMeetingDate('2024.01.15 Team Standup', '')).toBe('2024-01-15');
  });

  it('extracts date with slashes from title', () => {
    expect(extractMeetingDate('Meeting 01/15/2024', '')).toBe('2024-01-15');
  });

  it('extracts written date from title', () => {
    const result = extractMeetingDate('Meeting Notes Jan 15, 2024', '');
    expect(result).toBe('2024-01-15');
  });

  it('extracts date from content when not in title', () => {
    const content = 'Date: 2024-01-15\nAttendees: Alice, Bob';
    expect(extractMeetingDate('Team Meeting', content)).toBe('2024-01-15');
  });

  it('returns today for unknown format', () => {
    const result = extractMeetingDate('Random Meeting', 'No date here');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('parseMeetingNotes', () => {
  const docId = 'doc123';
  const docTitle = 'Meeting Notes 2024-01-15';

  it('extracts meeting date', () => {
    const result = parseMeetingNotes('Some content', docId, docTitle);
    expect(result.meetingDate).toBe('2024-01-15');
  });

  it('extracts action items from action items section', () => {
    const content = `
# Agenda
Discussion about API

# Action Items
- John: Implement the API endpoint
- @Sarah: Review the documentation
- Update the README (Owner: Mike)

# Notes
Other content
    `;
    const result = parseMeetingNotes(content, docId, docTitle);
    expect(result.actionItems).toHaveLength(3);
    expect(result.actionItems[0].text).toContain('Implement the API endpoint');
    expect(result.actionItems[0].assignee).toBe('John');
  });

  it('extracts action items from next steps section', () => {
    const content = `
# Summary
Meeting summary

## Next Steps
* Alice to complete the design
* Bob will handle testing

# End
    `;
    const result = parseMeetingNotes(content, docId, docTitle);
    expect(result.actionItems).toHaveLength(2);
    expect(result.actionItems[0].assignee).toBe('Alice');
    expect(result.actionItems[1].assignee).toBe('Bob');
  });

  it('extracts decisions', () => {
    const content = `
# Decisions
- Use React for the frontend
- Deploy to AWS

# Action Items
- Set up the project
    `;
    const result = parseMeetingNotes(content, docId, docTitle);
    expect(result.decisions).toHaveLength(2);
    expect(result.decisions[0]).toBe('Use React for the frontend');
  });

  it('categorizes decisions as decision category', () => {
    const content = `
# Decisions
- Use React for the frontend
    `;
    const result = parseMeetingNotes(content, docId, docTitle);
    const decisionItems = result.actionItems.filter(i => i.category === 'decision');
    expect(decisionItems).toHaveLength(1);
    expect(decisionItems[0].text).toBe('Use React for the frontend');
  });

  it('categorizes follow-up items correctly', () => {
    const content = `
# Action Items
- Follow up with the client about requirements
- Check in with team next week
    `;
    const result = parseMeetingNotes(content, docId, docTitle);
    expect(result.actionItems.every(i => i.category === 'followup')).toBe(true);
  });

  it('handles empty content', () => {
    const result = parseMeetingNotes('', docId, docTitle);
    expect(result.actionItems).toEqual([]);
    expect(result.decisions).toEqual([]);
  });

  it('handles content without recognized sections', () => {
    const content = 'Random notes without any structure';
    const result = parseMeetingNotes(content, docId, docTitle);
    expect(result.actionItems).toEqual([]);
    expect(result.decisions).toEqual([]);
  });

  it('handles markdown formatted sections', () => {
    const content = `
**Action Items**

- Complete the implementation

**Decisions**

- Approved the design
    `;
    const result = parseMeetingNotes(content, docId, docTitle);
    expect(result.actionItems.length).toBeGreaterThan(0);
  });

  it('removes assignee prefix from cleaned text', () => {
    const content = `
# Action Items
- @John: Complete the API endpoint
- Sarah: Review documentation
    `;
    const result = parseMeetingNotes(content, docId, docTitle);
    expect(result.actionItems[0].text).toBe('Complete the API endpoint');
    expect(result.actionItems[1].text).toBe('Review documentation');
  });
});
