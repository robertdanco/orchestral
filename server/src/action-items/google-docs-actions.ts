import type { GoogleDocsActionItem, GoogleDocsActionCategory, GoogleDoc } from '@orchestral/shared';
import type { GoogleDocsCache } from '../google/cache.js';
import { parseMeetingNotes, isMeetingNote } from '../google/parser.js';
import { sortActionItems } from './utils.js';

const CATEGORY_PRIORITY: Record<GoogleDocsActionCategory, GoogleDocsActionItem['priority']> = {
  'task': 'high',
  'decision': 'medium',
  'followup': 'medium',
};

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

function mapToGoogleDocsActionItem(
  doc: GoogleDoc,
  actionText: string,
  category: GoogleDocsActionCategory,
  meetingDate: string,
  assignee: string | null,
  index: number
): GoogleDocsActionItem {
  return {
    id: `google-docs-${doc.id}-${index}`,
    source: 'google-docs',
    title: truncateText(actionText, 100),
    reason: `From meeting notes: ${doc.name}`,
    url: doc.webViewLink,
    createdAt: doc.modifiedTime,
    priority: CATEGORY_PRIORITY[category],
    category,
    documentId: doc.id,
    documentTitle: doc.name,
    meetingDate,
    assignee,
  };
}

export function detectGoogleDocsActions(
  cache: GoogleDocsCache,
  meetingNotesPattern: string,
  currentUserEmail?: string
): GoogleDocsActionItem[] {
  const actionItems: GoogleDocsActionItem[] = [];

  // Get recent meeting notes from cache
  const documents = cache.getRecentDocuments(14); // Look back 2 weeks

  for (const doc of documents) {
    // Only process meeting notes
    if (!isMeetingNote(doc.name, meetingNotesPattern)) {
      continue;
    }

    // Skip documents without content
    if (!doc.content) {
      continue;
    }

    // Parse meeting notes
    const parsed = parseMeetingNotes(doc.content, doc.id, doc.name);

    // Create action items
    let index = 0;
    for (const item of parsed.actionItems) {
      // If currentUserEmail is provided, only include items assigned to current user
      // or items with no assignee (could be for anyone)
      if (currentUserEmail && item.assignee) {
        const emailUsername = currentUserEmail.split('@')[0].toLowerCase();
        const assigneeLower = item.assignee.toLowerCase();

        // Check if assignee matches current user (by name or email prefix)
        if (!assigneeLower.includes(emailUsername) && !emailUsername.includes(assigneeLower)) {
          continue;
        }
      }

      actionItems.push(
        mapToGoogleDocsActionItem(
          doc,
          item.text,
          item.category,
          parsed.meetingDate,
          item.assignee,
          index++
        )
      );
    }
  }

  sortActionItems(actionItems);

  return actionItems;
}
