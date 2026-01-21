import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JiraClient, JiraClientConfig } from './client.js';

describe('JiraClient', () => {
  const validConfig: JiraClientConfig = {
    baseUrl: 'https://test.atlassian.net',
    email: 'test@example.com',
    apiToken: 'test-token',
    projectKeys: ['PROJ'],
  };

  describe('constructor', () => {
    it('creates client with valid config', () => {
      const client = new JiraClient(validConfig);
      expect(client).toBeDefined();
    });

    it('throws if baseUrl is missing', () => {
      expect(() => new JiraClient({ ...validConfig, baseUrl: '' }))
        .toThrow('JIRA_URL is required');
    });

    it('throws if email is missing', () => {
      expect(() => new JiraClient({ ...validConfig, email: '' }))
        .toThrow('JIRA_EMAIL is required');
    });

    it('throws if apiToken is missing', () => {
      expect(() => new JiraClient({ ...validConfig, apiToken: '' }))
        .toThrow('JIRA_API_TOKEN is required');
    });
  });

  describe('getAuthHeader', () => {
    it('returns correct Basic auth header', () => {
      const client = new JiraClient(validConfig);
      const header = client.getAuthHeader();
      const expected = Buffer.from('test@example.com:test-token').toString('base64');
      expect(header).toBe(`Basic ${expected}`);
    });
  });

  describe('fetchIssues', () => {
    it('calls Jira API with correct JQL and auth', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          issues: [{
            key: 'PROJ-1',
            fields: {
              summary: 'Test issue',
              issuetype: { name: 'Story' },
              status: { name: 'To Do', statusCategory: { key: 'new' } },
              assignee: { displayName: 'John' },
              parent: { key: 'PROJ-100' },
              customfield_10016: 5,
              created: '2024-01-01T00:00:00.000Z',
              updated: '2024-01-15T00:00:00.000Z',
              labels: ['frontend'],
            },
          }],
          total: 1,
        }),
      });

      vi.stubGlobal('fetch', mockFetch);

      const client = new JiraClient(validConfig);
      const issues = await client.fetchIssues();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/rest/api/3/search'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': client.getAuthHeader(),
          }),
        })
      );
      expect(issues).toHaveLength(1);
      expect(issues[0].key).toBe('PROJ-1');

      vi.unstubAllGlobals();
    });

    it('throws on API error', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      vi.stubGlobal('fetch', mockFetch);

      const client = new JiraClient(validConfig);
      await expect(client.fetchIssues()).rejects.toThrow('Jira API error: 401');

      vi.unstubAllGlobals();
    });
  });
});
