// Display status types for 7-stage workflow visualization

export type DisplayStatus =
  | 'backlog'
  | 'triage'
  | 'in-progress'
  | 'code-review'
  | 'design-review'
  | 'in-qa'
  | 'done'
  | 'abandoned';

export type StatusGroup = 'unstarted' | 'active' | 'completed';

// Visible columns in Kanban view (excludes 'abandoned' which is hidden from normal view)
export const DISPLAY_STATUS_COLUMNS = [
  'backlog',
  'triage',
  'in-progress',
  'code-review',
  'design-review',
  'in-qa',
  'done',
] as const;

// All valid display statuses including hidden ones (for validation)
export const ALL_DISPLAY_STATUSES: readonly DisplayStatus[] = [
  ...DISPLAY_STATUS_COLUMNS,
  'abandoned',
];

export const STATUS_GROUP_MAP: Record<DisplayStatus, StatusGroup> = {
  backlog: 'unstarted',
  triage: 'unstarted',
  'in-progress': 'active',
  'code-review': 'active',
  'design-review': 'active',
  'in-qa': 'active',
  done: 'completed',
  abandoned: 'completed',
};

export const DISPLAY_STATUS_LABELS: Record<DisplayStatus, string> = {
  backlog: 'Backlog',
  triage: 'Triage',
  'in-progress': 'In Progress',
  'code-review': 'Code Review',
  'design-review': 'Design Review',
  'in-qa': 'In QA',
  done: 'Done',
  abandoned: 'Abandoned',
};

export const STATUS_GROUP_LABELS: Record<StatusGroup, string> = {
  unstarted: 'Not Started',
  active: 'Active Work',
  completed: 'Completed',
};
