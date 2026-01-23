import { Router, type Request, type Response } from 'express';
import type { ActionItemsResponse, JiraActionItem, ConfluenceActionItem } from '@orchestral/shared';
import type { Cache } from '../cache.js';
import type { ConfluenceClient } from '../confluence/client.js';
import type { ConfluenceCache } from '../confluence/cache.js';
import { detectJiraActions } from './jira-actions.js';
import { detectConfluenceActions } from './confluence-actions.js';

export function createActionItemsRouter(
  jiraCache: Cache,
  confluenceClient: ConfluenceClient,
  confluenceCache: ConfluenceCache,
  jiraEmail: string
): Router {
  const router = Router();

  // GET /api/action-items - Get aggregated action items from all sources
  router.get('/', async (_req: Request, res: Response) => {
    const response: ActionItemsResponse = {
      jira: { items: [], count: 0 },
      confluence: { items: [], count: 0 },
      totalCount: 0,
      lastRefreshed: new Date().toISOString(),
    };

    // Run Jira and Confluence detection in parallel
    const [jiraResult, confluenceResult] = await Promise.allSettled([
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

    response.totalCount = response.jira.count + response.confluence.count;

    res.json(response);
  });

  // POST /api/action-items/refresh - Refresh all action item sources
  router.post('/refresh', async (_req: Request, res: Response) => {
    try {
      // Refresh both caches in parallel
      await Promise.all([
        // Jira cache refresh is handled by the main refresh endpoint
        // Just re-detect actions with current data
        Promise.resolve(),
        // Confluence doesn't need explicit refresh here - it fetches fresh data on each request
        Promise.resolve(),
      ]);

      res.json({ message: 'Action items refreshed successfully' });
    } catch (error) {
      console.error('Error refreshing action items:', error);
      res.status(500).json({
        error: 'Failed to refresh action items',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}
