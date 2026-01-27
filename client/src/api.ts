import type {
  JiraItem,
  HierarchicalJiraItem,
  ActionRequiredResult,
  IssuesResponse,
  ConfluenceHierarchyResponse,
  ConfluencePagesResponse,
  ConfluenceSpacesResponse,
  ConfluencePage,
  ConfluenceSearchResult,
  ActionItemsResponse,
  ManualActionItem,
  CreateManualActionItemInput,
  UpdateManualActionItemInput,
  JiraActionSettings,
  UpdateJiraActionSettingsInput,
} from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: string | null = null
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    let body: string | null = null;
    try {
      body = await response.text();
    } catch {
      // Ignore body parsing errors
    }
    throw new ApiError(
      `API error: ${response.status} ${response.statusText}`,
      response.status,
      response.statusText,
      body
    );
  }
  return response.json();
}

export const api = {
  async getIssues(): Promise<IssuesResponse> {
    return fetchJson('/api/issues');
  },

  async getIssue(key: string): Promise<JiraItem> {
    return fetchJson(`/api/issues/${key}`);
  },

  async getHierarchy(): Promise<HierarchicalJiraItem[]> {
    return fetchJson('/api/hierarchy');
  },

  async getActions(): Promise<ActionRequiredResult> {
    return fetchJson('/api/actions');
  },

  async refresh(): Promise<{ message: string; count: number }> {
    return fetchJson('/api/refresh', { method: 'POST' });
  },

  // Confluence API
  async getConfluenceSpaces(): Promise<ConfluenceSpacesResponse> {
    return fetchJson('/api/confluence/spaces');
  },

  async getConfluencePages(): Promise<ConfluencePagesResponse> {
    return fetchJson('/api/confluence/pages');
  },

  async getConfluencePage(id: string): Promise<ConfluencePage> {
    return fetchJson(`/api/confluence/pages/${id}`);
  },

  async getConfluenceHierarchy(): Promise<ConfluenceHierarchyResponse> {
    return fetchJson('/api/confluence/hierarchy');
  },

  async searchConfluence(query: string): Promise<ConfluenceSearchResult> {
    return fetchJson(`/api/confluence/search?q=${encodeURIComponent(query)}`);
  },

  async refreshConfluence(): Promise<{ message: string; spacesCount: number; pagesCount: number }> {
    return fetchJson('/api/confluence/refresh', { method: 'POST' });
  },

  // Action Items API
  async getActionItems(): Promise<ActionItemsResponse> {
    return fetchJson('/api/action-items');
  },

  async refreshActionItems(): Promise<{ message: string }> {
    return fetchJson('/api/action-items/refresh', { method: 'POST' });
  },

  // Manual Action Items API
  async createManualActionItem(input: CreateManualActionItemInput): Promise<ManualActionItem> {
    return fetchJson('/api/action-items/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  },

  async updateManualActionItem(id: string, input: UpdateManualActionItemInput): Promise<ManualActionItem> {
    return fetchJson(`/api/action-items/manual/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  },

  async deleteManualActionItem(id: string): Promise<void> {
    await fetch(`/api/action-items/manual/${id}`, { method: 'DELETE' });
  },

  async completeManualActionItem(id: string): Promise<ManualActionItem> {
    return fetchJson(`/api/action-items/manual/${id}/complete`, { method: 'POST' });
  },

  async uncompleteManualActionItem(id: string): Promise<ManualActionItem> {
    return fetchJson(`/api/action-items/manual/${id}/incomplete`, { method: 'POST' });
  },

  // Jira Settings API
  async getJiraSettings(): Promise<JiraActionSettings> {
    return fetchJson('/api/action-items/jira-settings');
  },

  async updateJiraSettings(input: UpdateJiraActionSettingsInput): Promise<JiraActionSettings> {
    return fetchJson('/api/action-items/jira-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  },

  async resetJiraSettings(): Promise<JiraActionSettings> {
    return fetchJson('/api/action-items/jira-settings/reset', { method: 'POST' });
  },
};
