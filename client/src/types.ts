// Re-export shared types
export type {
  IssueType,
  StatusCategory,
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
