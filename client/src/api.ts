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
};
