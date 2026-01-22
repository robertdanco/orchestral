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

export interface HierarchicalJiraItem extends JiraItem {
  children: HierarchicalJiraItem[];
}

export interface ActionRequiredItem {
  item: JiraItem;
  reason: string;
}

export interface ActionRequiredResult {
  blockers: ActionRequiredItem[];
  blocked: ActionRequiredItem[];
  stale: ActionRequiredItem[];
  missingDetails: ActionRequiredItem[];
  unassigned: ActionRequiredItem[];
  unestimated: ActionRequiredItem[];
}

export interface IssuesResponse {
  issues: JiraItem[];
  lastRefreshed: string | null;
}
