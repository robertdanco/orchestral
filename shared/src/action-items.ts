// Action Items shared types - aggregates actionable items across integrations

import type { GoogleDocsActionCategory } from './google.js';

export type ActionItemSource = 'jira' | 'confluence' | 'manual' | 'slack' | 'google-docs';

export interface ActionItemBase {
  id: string;
  source: ActionItemSource;
  title: string;
  reason: string;
  url: string;
  createdAt: string;
  priority: 'high' | 'medium' | 'low';
}

// Manual Action Item types
export type ManualActionCategory = 'task' | 'followup' | 'decision' | 'reminder';

export interface JiraActionItem extends ActionItemBase {
  source: 'jira';
  category: 'blocker' | 'blocked' | 'stale' | 'missingDetails' | 'unassigned' | 'unestimated';
  issueKey: string;
}

export interface ConfluenceActionItem extends ActionItemBase {
  source: 'confluence';
  category: 'mention' | 'reply-needed' | 'unresolved-comment';
  pageId: string;
  pageTitle: string;
  spaceKey: string;
  commentId: string;
  authorName: string;
}

export interface ManualActionItem extends ActionItemBase {
  source: 'manual';
  category: ManualActionCategory;
  description?: string;
  dueDate?: string;
  completedAt?: string | null;
}

export type SlackActionCategory = 'mention' | 'thread-reply';

export interface SlackActionItem extends ActionItemBase {
  source: 'slack';
  category: SlackActionCategory;
  channelId: string;
  channelName: string;
  messageTs: string;
  threadTs: string | null;
  authorId: string;
  authorName: string;
}

export interface GoogleDocsActionItem extends ActionItemBase {
  source: 'google-docs';
  category: GoogleDocsActionCategory;
  documentId: string;
  documentTitle: string;
  meetingDate: string;
  assignee: string | null;
}

export type ActionItem = JiraActionItem | ConfluenceActionItem | ManualActionItem | SlackActionItem | GoogleDocsActionItem;

export interface ActionItemsResponse {
  jira: { items: JiraActionItem[]; count: number; error?: string };
  confluence: { items: ConfluenceActionItem[]; count: number; error?: string };
  manual: { items: ManualActionItem[]; count: number; error?: string };
  slack: { items: SlackActionItem[]; count: number; error?: string };
  googleDocs: { items: GoogleDocsActionItem[]; count: number; error?: string };
  totalCount: number;
  lastRefreshed: string;
}

// Input types for manual item CRUD operations
export interface CreateManualActionItemInput {
  title: string;
  reason: string;
  category: ManualActionCategory;
  priority: 'high' | 'medium' | 'low';
  description?: string;
  dueDate?: string;
}

export interface UpdateManualActionItemInput {
  title?: string;
  reason?: string;
  category?: ManualActionCategory;
  priority?: 'high' | 'medium' | 'low';
  description?: string;
  dueDate?: string;
}

export interface ConfluenceUser {
  accountId: string;
  displayName: string;
  email: string;
}

export interface ConfluenceComment {
  id: string;
  pageId: string;
  pageTitle: string;
  spaceKey: string;
  body: string;
  author: ConfluenceUser;
  createdAt: string;
  resolved: boolean;
  parentCommentId: string | null;
  mentions: string[];  // account IDs
}
