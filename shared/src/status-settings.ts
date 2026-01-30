// Status mapping configuration for customizing Jira status to display status mappings

import type { DisplayStatus } from './status.js';
import type { StatusCategory } from './index.js';

export interface StatusMappingConfig {
  // Direct mapping from Jira status name to display status
  statusToDisplay: Record<string, DisplayStatus>;
  // Fallback defaults when a status name isn't explicitly mapped
  categoryDefaults: Record<StatusCategory, DisplayStatus>;
}

export interface UpdateStatusMappingInput {
  statusToDisplay?: Record<string, DisplayStatus>;
  categoryDefaults?: Partial<Record<StatusCategory, DisplayStatus>>;
}

export const DEFAULT_STATUS_MAPPINGS: StatusMappingConfig = {
  statusToDisplay: {
    // Common "todo" status names
    'Backlog': 'backlog',
    'To Do': 'backlog',
    'Open': 'backlog',
    'New': 'backlog',
    'Triage': 'triage',
    'Needs Triage': 'triage',
    // Common "in progress" status names
    'In Progress': 'in-progress',
    'In Development': 'in-progress',
    'Developing': 'in-progress',
    'Code Review': 'code-review',
    'In Review': 'code-review',
    'Review': 'code-review',
    'PR Review': 'code-review',
    'Design Review': 'design-review',
    'UX Review': 'design-review',
    'In QA': 'in-qa',
    'QA': 'in-qa',
    'Testing': 'in-qa',
    'In Testing': 'in-qa',
    'Ready for QA': 'in-qa',
    // Common "done" status names
    'Done': 'done',
    'Closed': 'done',
    'Resolved': 'done',
    'Complete': 'done',
    'Completed': 'done',
    'Abandoned': 'abandoned',
    "Won't Do": 'abandoned',
    'Wont Do': 'abandoned',
    "Won't Fix": 'abandoned',
    'Wont Fix': 'abandoned',
    'Cancelled': 'abandoned',
    'Canceled': 'abandoned',
  },
  categoryDefaults: {
    todo: 'backlog',
    inprogress: 'in-progress',
    done: 'done',
  },
};
