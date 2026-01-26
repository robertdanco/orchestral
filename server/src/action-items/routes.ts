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

    // Process Jira result
    if (jiraResult.status === 'fulfilled') {
      response.jira.items = jiraResult.value;
      response.jira.count = jiraResult.value.length;
    } else {
      response.jira.error = jiraResult.reason?.message || 'Failed to fetch Jira actions';
    }

    // Process Confluence result
    if (confluenceResult.status === 'fulfilled') {
      response.confluence.items = confluenceResult.value;
      response.confluence.count = confluenceResult.value.length;
    } else {
      response.confluence.error = confluenceResult.reason?.message || 'Failed to fetch Confluence actions';
    }

    // Process Manual result
    if (manualResult.status === 'fulfilled') {
      response.manual.items = manualResult.value;
      response.manual.count = manualResult.value.length;
    } else {
      response.manual.error = manualResult.reason?.message || 'Failed to fetch manual items';
    }

    // Process Slack result
    if (slackResult.status === 'fulfilled') {
      response.slack.items = slackResult.value;
      response.slack.count = slackResult.value.length;
    } else {
      response.slack.error = slackResult.reason?.message || 'Failed to fetch Slack actions';
    }

    // Process Google Docs result
    if (googleDocsResult.status === 'fulfilled') {
      response.googleDocs.items = googleDocsResult.value;
      response.googleDocs.count = googleDocsResult.value.length;
    } else {
      response.googleDocs.error = googleDocsResult.reason?.message || 'Failed to fetch Google Docs actions';
    }

    response.totalCount = response.jira.count + response.confluence.count + response.manual.count + response.slack.count + response.googleDocs.count;

    res.json(response);
  });

  return router;
}
