// Types for configurable Jira action detection settings

export type JiraActionCategory = 'blocker' | 'blocked' | 'stale' | 'missingDetails' | 'unassigned' | 'unestimated';

// Local type to avoid circular dependency with index.ts
type StatusCategoryType = 'todo' | 'inprogress' | 'done';

export interface JiraActionSettings {
  staleDays: number;
  requireEstimates: boolean;
  enabledCategories: Record<JiraActionCategory, boolean>;
  statusMappings: {
    staleStatusCategories: StatusCategoryType[];
    unassignedStatusCategories: StatusCategoryType[];
  };
}

export interface UpdateJiraActionSettingsInput {
  staleDays?: number;
  requireEstimates?: boolean;
  enabledCategories?: Partial<Record<JiraActionCategory, boolean>>;
  statusMappings?: Partial<JiraActionSettings['statusMappings']>;
}

export const DEFAULT_JIRA_ACTION_SETTINGS: JiraActionSettings = {
  staleDays: 5,
  requireEstimates: true,
  enabledCategories: {
    blocker: true,
    blocked: true,
    stale: true,
    missingDetails: true,
    unassigned: true,
    unestimated: true,
  },
  statusMappings: {
    staleStatusCategories: ['inprogress'],
    unassignedStatusCategories: ['todo', 'inprogress'],
  },
};

export const JIRA_ACTION_CATEGORY_LABELS: Record<JiraActionCategory, string> = {
  blocker: 'Blockers',
  blocked: 'Blocked Items',
  stale: 'Stale Items',
  missingDetails: 'Missing Details',
  unassigned: 'Unassigned',
  unestimated: 'Unestimated Stories',
};
