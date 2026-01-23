// Action Items shared types - aggregates actionable items across integrations

export type ActionItemSource = 'jira' | 'confluence';

export interface ActionItemBase {
  id: string;
  source: ActionItemSource;
  title: string;
  reason: string;
  url: string;
  createdAt: string;
  priority: 'high' | 'medium' | 'low';
}

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

export type ActionItem = JiraActionItem | ConfluenceActionItem;

export interface ActionItemsResponse {
  jira: { items: JiraActionItem[]; count: number; error?: string };
  confluence: { items: ConfluenceActionItem[]; count: number; error?: string };
  totalCount: number;
  lastRefreshed: string;
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
