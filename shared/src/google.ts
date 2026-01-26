// Google Docs shared types

export interface GoogleDoc {
  id: string;
  name: string;
  webViewLink: string;
  modifiedTime: string;
  content: string | null;
  folderName: string | null;
}

// Meeting note action item categories
export type GoogleDocsActionCategory = 'task' | 'decision' | 'followup';

// Parsed action item from meeting notes
export interface ParsedActionItem {
  text: string;
  assignee: string | null;
  category: GoogleDocsActionCategory;
}

// Parsed meeting notes result
export interface ParsedMeetingNotes {
  meetingDate: string;
  actionItems: ParsedActionItem[];
  decisions: string[];
}
