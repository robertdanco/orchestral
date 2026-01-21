export interface JiraClientConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKeys: string[];
}

export class JiraClient {
  private baseUrl: string;
  private email: string;
  private apiToken: string;
  private projectKeys: string[];

  constructor(config: JiraClientConfig) {
    if (!config.baseUrl) throw new Error('JIRA_URL is required');
    if (!config.email) throw new Error('JIRA_EMAIL is required');
    if (!config.apiToken) throw new Error('JIRA_API_TOKEN is required');

    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.email = config.email;
    this.apiToken = config.apiToken;
    this.projectKeys = config.projectKeys;
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
}
