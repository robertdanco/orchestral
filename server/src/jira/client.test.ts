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
});
