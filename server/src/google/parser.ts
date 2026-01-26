import type { ParsedActionItem, ParsedMeetingNotes, GoogleDocsActionCategory } from '@orchestral/shared';

/**
 * Check if a file name matches the meeting notes pattern
 */
export function isMeetingNote(fileName: string, pattern: string): boolean {
  try {
    const regex = new RegExp(pattern, 'i');
    return regex.test(fileName);
  } catch {
    // Fall back to simple contains check if regex is invalid
    return fileName.toLowerCase().includes('meeting');
  }
}

/**
 * Extract meeting date from document title or content
 */
export function extractMeetingDate(docTitle: string, content: string): string {
  // Try to extract date from title first
  // Common formats: "Meeting Notes 2024-01-15", "2024.01.15 Team Standup", "Jan 15, 2024"

  // ISO date format: YYYY-MM-DD
  const isoMatch = docTitle.match(/(\d{4}[-./]\d{1,2}[-./]\d{1,2})/);
  if (isoMatch) {
    return normalizeDate(isoMatch[1]);
  }

  // US date format: MM/DD/YYYY or MM-DD-YYYY
  const usMatch = docTitle.match(/(\d{1,2}[-./]\d{1,2}[-./]\d{4})/);
  if (usMatch) {
    return normalizeDate(usMatch[1]);
  }

  // Written format: "Jan 15, 2024" or "January 15, 2024"
  const writtenMatch = docTitle.match(/((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4})/i);
  if (writtenMatch) {
    try {
      const date = new Date(writtenMatch[1]);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch {
      // Continue to content check
    }
  }

  // Try to find date in content (first few lines)
  const contentLines = content.split('\n').slice(0, 10).join('\n');

  const contentIsoMatch = contentLines.match(/(\d{4}[-./]\d{1,2}[-./]\d{1,2})/);
  if (contentIsoMatch) {
    return normalizeDate(contentIsoMatch[1]);
  }

  const contentWrittenMatch = contentLines.match(/((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4})/i);
  if (contentWrittenMatch) {
    try {
      const date = new Date(contentWrittenMatch[1]);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch {
      // Fall through to default
    }
  }

  // Default to today if no date found
  return new Date().toISOString().split('T')[0];
}

/**
 * Normalize various date formats to ISO format (YYYY-MM-DD)
 */
function normalizeDate(dateStr: string): string {
  // Replace various separators with dashes
  const normalized = dateStr.replace(/[./]/g, '-');
  const parts = normalized.split('-');

  if (parts.length !== 3) {
    return new Date().toISOString().split('T')[0];
  }

  // Check if first part is year (YYYY-MM-DD) or month (MM-DD-YYYY)
  if (parts[0].length === 4) {
    // YYYY-MM-DD format
    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
  } else {
    // MM-DD-YYYY format
    return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  }
}

/**
 * Extract section content between two headers or until end of document
 */
function extractSection(content: string, sectionHeaders: string[]): string | null {
  const headerPattern = sectionHeaders
    .map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');

  // Match section header (with optional # or ** markdown formatting)
  const sectionRegex = new RegExp(
    `(?:^|\\n)(?:#+\\s*|\\*\\*)?(?:${headerPattern})(?:\\*\\*)?:?\\s*\\n([\\s\\S]*?)(?=\\n(?:#+\\s*|\\*\\*)(?:[A-Z][a-zA-Z\\s]+)(?:\\*\\*)?:?\\s*\\n|$)`,
    'i'
  );

  const match = content.match(sectionRegex);
  return match ? match[1].trim() : null;
}

/**
 * Parse action items from a section of text
 */
function parseActionItems(sectionText: string): ParsedActionItem[] {
  const items: ParsedActionItem[] = [];
  const lines = sectionText.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip lines that look like headers
    if (trimmed.startsWith('#') || (trimmed.startsWith('**') && trimmed.endsWith('**'))) {
      continue;
    }

    // Match list items (-, *, •, or numbered)
    const listMatch = trimmed.match(/^(?:[-*•]|\d+[.)]\s*)\s*(.+)/);
    if (!listMatch) continue;

    const itemText = listMatch[1].trim();
    if (!itemText) continue;

    // Extract assignee
    const assignee = extractAssignee(itemText);

    // Determine category based on content
    const category = categorizeActionItem(itemText);

    items.push({
      text: cleanActionItemText(itemText),
      assignee,
      category,
    });
  }

  return items;
}

/**
 * Extract assignee from action item text
 */
function extractAssignee(text: string): string | null {
  // Pattern: @Name: or @Name -
  const atMentionMatch = text.match(/@([A-Za-z]+(?:\s+[A-Za-z]+)?)\s*[:–-]/);
  if (atMentionMatch) {
    return atMentionMatch[1].trim();
  }

  // Pattern: Name: at the beginning
  const colonMatch = text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*:/);
  if (colonMatch) {
    return colonMatch[1].trim();
  }

  // Pattern: "Name to..." or "Name will..."
  const toWillMatch = text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:to|will|should)\s/i);
  if (toWillMatch) {
    return toWillMatch[1].trim();
  }

  // Pattern: (Owner: Name) or [Owner: Name]
  const ownerMatch = text.match(/[[(](?:Owner|Assigned|Assignee|DRI):\s*([A-Za-z]+(?:\s+[A-Za-z]+)?)[)\]]/i);
  if (ownerMatch) {
    return ownerMatch[1].trim();
  }

  return null;
}

/**
 * Categorize action item based on content
 */
function categorizeActionItem(text: string): GoogleDocsActionCategory {
  const lowerText = text.toLowerCase();

  // Follow-up indicators
  if (
    lowerText.includes('follow up') ||
    lowerText.includes('follow-up') ||
    lowerText.includes('check in') ||
    lowerText.includes('revisit') ||
    lowerText.includes('circle back')
  ) {
    return 'followup';
  }

  // Default to task
  return 'task';
}

/**
 * Clean action item text by removing assignee prefix
 */
function cleanActionItemText(text: string): string {
  // Remove @Name: prefix
  let cleaned = text.replace(/@[A-Za-z]+(?:\s+[A-Za-z]+)?\s*[:–-]\s*/, '');

  // Remove Name: prefix at beginning
  cleaned = cleaned.replace(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s*:\s*/, '');

  // Remove owner tags
  cleaned = cleaned.replace(/[[(](?:Owner|Assigned|Assignee|DRI):\s*[A-Za-z]+(?:\s+[A-Za-z]+)?[)\]]\s*/gi, '');

  return cleaned.trim();
}

/**
 * Parse decisions from a section of text
 */
function parseDecisions(sectionText: string): string[] {
  const decisions: string[] = [];
  const lines = sectionText.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip lines that look like headers
    if (trimmed.startsWith('#') || (trimmed.startsWith('**') && trimmed.endsWith('**'))) {
      continue;
    }

    // Match list items (-, *, •, or numbered)
    const listMatch = trimmed.match(/^(?:[-*•]|\d+[.)]\s*)\s*(.+)/);
    if (listMatch && listMatch[1].trim()) {
      decisions.push(listMatch[1].trim());
    }
  }

  return decisions;
}

/**
 * Parse meeting notes content to extract action items and decisions
 */
export function parseMeetingNotes(content: string, docId: string, docTitle: string): ParsedMeetingNotes {
  const actionItems: ParsedActionItem[] = [];
  const decisions: string[] = [];

  // Extract meeting date
  const meetingDate = extractMeetingDate(docTitle, content);

  // Look for action items section
  const actionSectionHeaders = [
    'Action Items',
    'Action items',
    'Actions',
    'Next Steps',
    'Next steps',
    'To Do',
    'To-Do',
    'TODO',
    'Tasks',
    'Follow-up Actions',
    'Follow-up Items',
    'Follow Up',
  ];

  const actionSection = extractSection(content, actionSectionHeaders);
  if (actionSection) {
    actionItems.push(...parseActionItems(actionSection));
  }

  // Look for decisions section
  const decisionSectionHeaders = [
    'Decisions',
    'Key Decisions',
    'Decisions Made',
    'Outcomes',
    'Resolutions',
    'Agreed',
    'Agreements',
  ];

  const decisionSection = extractSection(content, decisionSectionHeaders);
  if (decisionSection) {
    decisions.push(...parseDecisions(decisionSection));

    // Also add decisions as action items with 'decision' category
    for (const decision of decisions) {
      actionItems.push({
        text: decision,
        assignee: null,
        category: 'decision',
      });
    }
  }

  return {
    meetingDate,
    actionItems,
    decisions,
  };
}
