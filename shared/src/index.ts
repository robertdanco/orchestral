// Shared types for Orchestral

// Re-export Status types
export type {
  DisplayStatus,
  StatusGroup,
} from './status.js';
export {
  DISPLAY_STATUS_COLUMNS,
  ALL_DISPLAY_STATUSES,
  STATUS_GROUP_MAP,
  DISPLAY_STATUS_LABELS,
  STATUS_GROUP_LABELS,
} from './status.js';

// Re-export Status Settings types
export type {
  StatusMappingConfig,
  UpdateStatusMappingInput,
} from './status-settings.js';
export { DEFAULT_STATUS_MAPPINGS } from './status-settings.js';

// Re-export Onboarding types
export type {
  JiraProjectInfo,
  JiraStatusInfo,
  ConfluenceSpaceInfo,
  OnboardingSettings,
  OnboardingStatus,
  UpdateOnboardingSettingsInput,
} from './onboarding.js';
export { DEFAULT_ONBOARDING_SETTINGS } from './onboarding.js';

// Re-export Jira Settings types
export type {
  JiraActionCategory,
  JiraActionSettings,
  UpdateJiraActionSettingsInput,
} from './jira-settings.js';
export {
  DEFAULT_JIRA_ACTION_SETTINGS,
  JIRA_ACTION_CATEGORY_LABELS,
} from './jira-settings.js';

// Re-export Action Items types
export type {
  ActionItemSource,
  ActionItemBase,
  JiraActionItem,
  ConfluenceActionItem,
  ManualActionCategory,
  ManualActionItem,
  SlackActionCategory,
  SlackActionItem,
  GoogleDocsActionItem,
  ActionItem,
  ActionItemsResponse,
  CreateManualActionItemInput,
  UpdateManualActionItemInput,
  ConfluenceUser,
  ConfluenceComment,
} from './action-items.js';

// Re-export Google types
export type {
  GoogleDoc,
  GoogleDocsActionCategory,
  ParsedActionItem,
  ParsedMeetingNotes,
} from './google.js';

// Re-export Slack types
export type {
  SlackChannel,
  SlackMessage,
  SlackReaction,
  SlackUser,
} from './slack.js';

// Re-export Confluence types
export type {
  ConfluenceSpace,
  ConfluencePage,
  HierarchicalConfluencePage,
  ConfluenceSpaceWithPages,
  ConfluenceHierarchyResponse,
  ConfluencePagesResponse,
  ConfluenceSpacesResponse,
  ConfluenceSearchResult,
} from './confluence.js';

// Re-export Fireflies types
export type {
  FirefliesParticipant,
  FirefliesTranscriptSentence,
  FirefliesActionItem,
  FirefliesAISummary,
  FirefliesMeeting,
  FirefliesMeetingListItem,
  FirefliesMeetingsResponse,
} from './fireflies.js';

// Re-export Feature Request types
export type {
  FeatureRequestSource,
  RICEScore,
  FeatureRequestMention,
  FeatureRequest,
  FeatureRequestListItem,
  FeatureRequestsResponse,
  CreateFeatureRequestInput,
  UpdateFeatureRequestInput,
  ExtractedFeatureRequest,
} from './feature-requests.js';

import type { DisplayStatus } from './status.js';

export type IssueType = 'initiative' | 'epic' | 'story' | 'task' | 'bug';
export type StatusCategory = 'todo' | 'inprogress' | 'done';

export interface JiraItem {
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

// Validation utility
const REQUIRED_FIELDS = [
  'key', 'summary', 'type', 'status', 'statusCategory', 'displayStatus',
  'created', 'updated', 'labels', 'blocked', 'url'
];

export function isValidJiraItem(obj: unknown): obj is JiraItem {
  if (typeof obj !== 'object' || obj === null) return false;
  const record = obj as Record<string, unknown>;
  return REQUIRED_FIELDS.every(field => field in record);
}
