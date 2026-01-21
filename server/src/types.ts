export type IssueType = 'initiative' | 'epic' | 'story' | 'task' | 'bug';
export type StatusCategory = 'todo' | 'inprogress' | 'done';

export interface JiraItem {
  key: string;
  summary: string;
  type: IssueType;
  status: string;
  statusCategory: StatusCategory;
  assignee: string | null;
  parentKey: string | null;
  estimate: number | null;
  created: string;
  updated: string;
  labels: string[];
  blocked: boolean;
  blockedReason: string | null;
  url: string;
}

export interface JiraItemDetail extends JiraItem {
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

export interface HierarchicalJiraItem extends JiraItem {
  children: HierarchicalJiraItem[];
}

const REQUIRED_FIELDS = [
  'key', 'summary', 'type', 'status', 'statusCategory',
  'created', 'updated', 'labels', 'blocked', 'url'
];

export function isValidJiraItem(obj: unknown): obj is JiraItem {
  if (typeof obj !== 'object' || obj === null) return false;
  const record = obj as Record<string, unknown>;
  return REQUIRED_FIELDS.every(field => field in record);
}
