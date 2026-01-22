// Re-export shared types
export type {
  IssueType,
  StatusCategory,
  JiraItem,
  HierarchicalJiraItem,
  ActionRequiredItem,
  ActionRequiredResult,
  IssuesResponse,
} from '@orchestral/shared';
export { isValidJiraItem } from '@orchestral/shared';

// Server-only types

export interface JiraItemDetail {
  key: string;
  summary: string;
  type: import('@orchestral/shared').IssueType;
  status: string;
  statusCategory: import('@orchestral/shared').StatusCategory;
  assignee: string | null;
  parentKey: string | null;
  estimate: number | null;
  created: string;
  updated: string;
  labels: string[];
  blocked: boolean;
  blockedReason: string | null;
  url: string;
  description: string | null;
  acceptanceCriteria: string | null;
  comments: Comment[];
  linkedIssues: LinkedIssue[];
}

export interface Comment {
  id: string;
  author: string;
  body: string;
  created: string;
}

export interface LinkedIssue {
  key: string;
  summary: string;
  type: import('@orchestral/shared').IssueType;
  linkType: string;
}
