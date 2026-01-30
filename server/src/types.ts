// Re-export shared types
export type {
  IssueType,
  StatusCategory,
  DisplayStatus,
  JiraItem,
  HierarchicalJiraItem,
  ActionRequiredItem,
  ActionRequiredResult,
  IssuesResponse,
  // Confluence types
  ConfluenceSpace,
  ConfluencePage,
  HierarchicalConfluencePage,
  ConfluenceSpaceWithPages,
  ConfluenceHierarchyResponse,
  ConfluencePagesResponse,
  ConfluenceSpacesResponse,
  ConfluenceSearchResult,
} from '@orchestral/shared';
export { isValidJiraItem } from '@orchestral/shared';

import type { IssueType, StatusCategory, DisplayStatus } from '@orchestral/shared';

// Server-only types

export interface JiraItemDetail {
  key: string;
  summary: string;
  type: IssueType;
  status: string;
  statusCategory: StatusCategory;
  displayStatus: DisplayStatus;
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
  type: IssueType;
  linkType: string;
}
