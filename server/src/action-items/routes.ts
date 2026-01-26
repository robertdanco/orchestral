import { Router, type Request, type Response } from 'express';
import type { ActionItemsResponse, JiraActionItem, ConfluenceActionItem, ManualActionItem, SlackActionItem, GoogleDocsActionItem } from '@orchestral/shared';
import type { Cache } from '../cache.js';
import type { ConfluenceClient } from '../confluence/client.js';
import type { ConfluenceCache } from '../confluence/cache.js';
import type { SlackClient } from '../slack/client.js';
import type { SlackCache } from '../slack/cache.js';
import type { GoogleClient } from '../google/client.js';
import type { GoogleDocsCache } from '../google/cache.js';
import type { ManualItemsCache } from './manual-cache.js';
import { detectJiraActions } from './jira-actions.js';
import { detectConfluenceActions } from './confluence-actions.js';
import { detectSlackActions } from './slack-actions.js';
import { detectGoogleDocsActions } from './google-docs-actions.js';
import { createManualItemsRouter } from './manual-routes.js';
import { processResult } from './utils.js';

export function createActionItemsRouter(
  jiraCache: Cache,
  confluenceClient: ConfluenceClient,
  confluenceCache: ConfluenceCache,
  manualCache: ManualItemsCache,
  slackClient?: SlackClient,
  slackCache?: SlackCache,
  googleClient?: GoogleClient,
  googleCache?: GoogleDocsCache,
  meetingNotesPattern?: string
): Router {
  const router = Router();

  // Mount manual items subrouter
  router.use('/manual', createManualItemsRouter(manualCache));

  // POST /api/action-items/refresh - Clear caches to force refetch
  router.post('/refresh', async (_req: Request, res: Response) => {
    jiraCache.clear();
    confluenceCache.clear();
    if (googleCache) googleCache.clear();
    res.json({ message: 'Action items cache cleared' });
  });

  // GET /api/action-items - Get aggregated action items from all sources
  router.get('/', async (_req: Request, res: Response) => {
    const response: ActionItemsResponse = {
      jira: { items: [], count: 0 },
      confluence: { items: [], count: 0 },
      manual: { items: [], count: 0 },
      slack: { items: [], count: 0 },
      googleDocs: { items: [], count: 0 },
      totalCount: 0,
      lastRefreshed: new Date().toISOString(),
    };

    // Run Jira, Confluence, Manual, Slack, and Google Docs detection in parallel
    const [jiraResult, confluenceResult, manualResult, slackResult, googleDocsResult] = await Promise.allSettled([
      (async (): Promise<JiraActionItem[]> => {
        const issues = jiraCache.getIssues();
        if (issues.length === 0) {
          // Trigger cache population if empty
          return [];
        }
        return detectJiraActions(issues);
      })(),
      (async (): Promise<ConfluenceActionItem[]> => {
        const currentUser = await confluenceClient.getCurrentUser();
        return detectConfluenceActions(
          confluenceClient,
          confluenceCache,
          currentUser.accountId,
          confluenceClient.getBaseUrl()
        );
      })(),
      (async (): Promise<ManualActionItem[]> => {
        return manualCache.getAll();
      })(),
      (async (): Promise<SlackActionItem[]> => {
        if (!slackClient || !slackCache) {
          return [];
        }
        const currentUser = await slackClient.getCurrentUser();
        return detectSlackActions(slackCache, currentUser.userId);
      })(),
      (async (): Promise<GoogleDocsActionItem[]> => {
        if (!googleClient || !googleCache) {
          return [];
        }
        const pattern = meetingNotesPattern || 'Meeting Notes.*|Transcript.*';
        return detectGoogleDocsActions(googleCache, pattern);
      })(),
    ]);

    // Process results
    processResult(jiraResult, response.jira, 'Failed to fetch Jira actions');
    processResult(confluenceResult, response.confluence, 'Failed to fetch Confluence actions');
    processResult(manualResult, response.manual, 'Failed to fetch manual items');
    processResult(slackResult, response.slack, 'Failed to fetch Slack actions');
    processResult(googleDocsResult, response.googleDocs, 'Failed to fetch Google Docs actions');

    response.totalCount = response.jira.count + response.confluence.count + response.manual.count + response.slack.count + response.googleDocs.count;

    res.json(response);
  });

  return router;
}
