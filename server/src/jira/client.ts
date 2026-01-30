import { JiraItem, IssueType, StatusCategory, DisplayStatus } from '../types.js';
import type { JiraProjectInfo, JiraStatusInfo, StatusMappingConfig } from '@orchestral/shared';
import { DEFAULT_STATUS_MAPPINGS } from '@orchestral/shared';

export interface JiraClientConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKeys: string[];
}

interface JiraSearchResponse {
  issues: JiraIssue[];
  total: number;
}

interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    issuetype: { name: string };
    status: { name: string; statusCategory: { key: string } };
    assignee: { displayName: string } | null;
    parent: { key: string } | null;
    customfield_10016: number | null;
    created: string;
    updated: string;
    labels: string[];
    issuelinks?: JiraIssueLink[];
  };
}

interface JiraIssueLink {
  type: { name: string };
  inwardIssue?: { key: string; fields?: { summary: string } };
  outwardIssue?: { key: string; fields?: { summary: string } };
}

export class JiraClient {
  private baseUrl: string;
  private email: string;
  private apiToken: string;
  private projectKeys: string[];
  private statusMappings: StatusMappingConfig;

  constructor(config: JiraClientConfig) {
    if (!config.baseUrl) throw new Error('JIRA_URL is required');
    if (!config.email) throw new Error('JIRA_EMAIL is required');
    if (!config.apiToken) throw new Error('JIRA_API_TOKEN is required');

    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.email = config.email;
    this.apiToken = config.apiToken;
    this.projectKeys = config.projectKeys;
    this.statusMappings = { ...DEFAULT_STATUS_MAPPINGS };
  }

  setStatusMappings(mappings: StatusMappingConfig): void {
    this.statusMappings = mappings;
  }

  getStatusMappings(): StatusMappingConfig {
    return this.statusMappings;
  }

  getAuthHeader(): string {
    const credentials = Buffer.from(`${this.email}:${this.apiToken}`).toString('base64');
    return `Basic ${credentials}`;
  }

  getProjectKeys(): string[] {
    return this.projectKeys;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async fetchIssues(): Promise<JiraItem[]> {
    const jql = `project in (${this.projectKeys.join(',')}) ORDER BY updated DESC`;
    const fields = [
      'summary', 'issuetype', 'status', 'assignee', 'parent',
      'customfield_10016', 'created', 'updated', 'labels',
      'issuelinks', 'priority'
    ].join(',');

    const url = `${this.baseUrl}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=${fields}&maxResults=1000`;

    const response = await fetch(url, {
      headers: {
        'Authorization': this.getAuthHeader(),
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Jira API error: ${response.status}`);
    }

    const data = await response.json() as JiraSearchResponse;
    return data.issues.map(issue => this.mapIssue(issue));
  }

  private mapIssue(issue: JiraIssue): JiraItem {
    const blockerLink = issue.fields.issuelinks?.find(
      link => link.type.name === 'Blocks' && link.inwardIssue
    );

    const statusName = issue.fields.status.name;
    const statusCategory = this.mapStatusCategory(issue.fields.status.statusCategory.key);

    return {
      key: issue.key,
      summary: issue.fields.summary,
      type: this.mapIssueType(issue.fields.issuetype.name),
      status: statusName,
      statusCategory,
      displayStatus: this.mapDisplayStatus(statusName, statusCategory),
      assignee: issue.fields.assignee?.displayName ?? null,
      parentKey: issue.fields.parent?.key ?? null,
      estimate: issue.fields.customfield_10016 ?? null,
      created: issue.fields.created,
      updated: issue.fields.updated,
      labels: issue.fields.labels ?? [],
      blocked: !!blockerLink,
      blockedReason: blockerLink?.inwardIssue?.fields?.summary ?? null,
      url: `${this.baseUrl}/browse/${issue.key}`,
    };
  }

  private mapDisplayStatus(statusName: string, category: StatusCategory): DisplayStatus {
    // First check for direct mapping by status name
    const directMapping = this.statusMappings.statusToDisplay[statusName];
    if (directMapping) {
      return directMapping;
    }

    // Fall back to category default
    return this.statusMappings.categoryDefaults[category];
  }

  private mapIssueType(name: string): IssueType {
    const normalized = name.toLowerCase();
    if (normalized.includes('initiative')) return 'initiative';
    if (normalized.includes('epic')) return 'epic';
    if (normalized.includes('story')) return 'story';
    if (normalized.includes('bug')) return 'bug';
    return 'task';
  }

  private mapStatusCategory(key: string): StatusCategory {
    if (key === 'new' || key === 'undefined') return 'todo';
    if (key === 'indeterminate') return 'inprogress';
    return 'done';
  }

  async fetchProjects(): Promise<JiraProjectInfo[]> {
    const url = `${this.baseUrl}/rest/api/3/project`;

    const response = await fetch(url, {
      headers: {
        'Authorization': this.getAuthHeader(),
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Jira API error: ${response.status}`);
    }

    interface JiraProject {
      key: string;
      name: string;
      avatarUrls?: { '48x48'?: string };
    }

    const data = await response.json() as JiraProject[];
    return data.map(project => ({
      key: project.key,
      name: project.name,
      avatarUrl: project.avatarUrls?.['48x48'],
    }));
  }

  async fetchStatuses(): Promise<JiraStatusInfo[]> {
    const url = `${this.baseUrl}/rest/api/3/status`;

    const response = await fetch(url, {
      headers: {
        'Authorization': this.getAuthHeader(),
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Jira API error: ${response.status}`);
    }

    interface JiraStatus {
      id: string;
      name: string;
      statusCategory: { key: string };
    }

    const data = await response.json() as JiraStatus[];

    // Deduplicate by name since same status can appear multiple times
    const seen = new Set<string>();
    return data
      .filter(status => {
        if (seen.has(status.name)) return false;
        seen.add(status.name);
        return true;
      })
      .map(status => ({
        id: status.id,
        name: status.name,
        category: this.mapStatusCategory(status.statusCategory.key),
      }));
  }

  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/rest/api/3/myself`;
      const response = await fetch(url, {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/json',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
