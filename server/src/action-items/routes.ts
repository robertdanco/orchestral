import { Router, type Request, type Response } from 'express';
import type { ActionItemsResponse, JiraActionItem, ConfluenceActionItem, ManualActionItem } from '@orchestral/shared';
import type { Cache } from '../cache.js';
import type { ConfluenceClient } from '../confluence/client.js';
import type { ConfluenceCache } from '../confluence/cache.js';
import type { ManualItemsCache } from './manual-cache.js';
import { detectJiraActions } from './jira-actions.js';
import { detectConfluenceActions } from './confluence-actions.js';
import { createManualItemsRouter } from './manual-routes.js';

export function createActionItemsRouter(
  jiraCache: Cache,
  confluenceClient: ConfluenceClient,
  confluenceCache: ConfluenceCache,
  manualCache: ManualItemsCache
): Router {
  const router = Router();

  // Mount manual items subrouter
  router.use('/manual', createManualItemsRouter(manualCache));

  // GET /api/action-items - Get aggregated action items from all sources
  router.get('/', async (_req: Request, res: Response) => {
    const response: ActionItemsResponse = {
      jira: { items: [], count: 0 },
      confluence: { items: [], count: 0 },
      manual: { items: [], count: 0 },
      totalCount: 0,
      lastRefreshed: new Date().toISOString(),
    };

    // Run Jira, Confluence, and Manual detection in parallel
    const [jiraResult, confluenceResult, manualResult] = await Promise.allSettled([
      (async (): Promise<JiraActionItem[]> => {
        const issues = jiraCache.getIssues();
        if (issues.length === 0) {
          // Trigger cache population if empty
          return [];
        }
        return detectJiraActions(issues);
      })(),
      (async (): Promise<ConfluenceActionItem[]> => {
        try {
          // Get current user ID from Confluence
          const currentUser = await confluenceClient.getCurrentUser();
          return await detectConfluenceActions(
            confluenceClient,
            confluenceCache,
            currentUser.accountId,
            confluenceClient.getBaseUrl()
          );
        } catch (error) {
          console.error('Error fetching Confluence actions:', error);
          throw error;
        }
      })(),
      (async (): Promise<ManualActionItem[]> => {
        return manualCache.getAll();
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

    response.totalCount = response.jira.count + response.confluence.count + response.manual.count;

    res.json(response);
  });

  return router;
}
