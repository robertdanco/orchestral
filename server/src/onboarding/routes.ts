import { Router, type Request, type Response } from 'express';
import type { OnboardingStatus, UpdateOnboardingSettingsInput } from '@orchestral/shared';
import type { JiraClient } from '../jira/client.js';
import type { ConfluenceClient } from '../confluence/client.js';
import type { OnboardingSettingsCache } from './settings-cache.js';

export function createOnboardingRouter(
  settingsCache: OnboardingSettingsCache,
  jiraClient: JiraClient,
  confluenceClient?: ConfluenceClient
): Router {
  const router = Router();

  // GET /api/onboarding/status - Get onboarding completion status
  router.get('/status', (_req: Request, res: Response) => {
    const settings = settingsCache.get();
    const response: OnboardingStatus = {
      isComplete: settingsCache.isComplete(),
      settings,
    };
    res.json(response);
  });

  // GET /api/onboarding/connection - Test API connection
  router.get('/connection', async (_req: Request, res: Response) => {
    try {
      const connected = await jiraClient.testConnection();
      res.json({ connected });
    } catch {
      res.json({ connected: false });
    }
  });

  // GET /api/onboarding/jira/projects - Fetch all accessible Jira projects
  router.get('/jira/projects', async (_req: Request, res: Response) => {
    try {
      const projects = await jiraClient.fetchProjects();
      res.json({ projects });
    } catch (error) {
      console.error('Error fetching Jira projects:', error);
      res.status(500).json({ error: 'Failed to fetch Jira projects' });
    }
  });

  // GET /api/onboarding/jira/statuses - Fetch all Jira statuses
  router.get('/jira/statuses', async (_req: Request, res: Response) => {
    try {
      const statuses = await jiraClient.fetchStatuses();
      res.json({ statuses });
    } catch (error) {
      console.error('Error fetching Jira statuses:', error);
      res.status(500).json({ error: 'Failed to fetch Jira statuses' });
    }
  });

  // GET /api/onboarding/confluence/spaces - Fetch all accessible Confluence spaces
  router.get('/confluence/spaces', async (_req: Request, res: Response) => {
    if (!confluenceClient) {
      res.json({ spaces: [], available: false });
      return;
    }

    try {
      const spaces = await confluenceClient.fetchSpaces();
      res.json({
        spaces: spaces.map(space => ({
          key: space.key,
          name: space.name,
          type: space.type,
        })),
        available: true,
      });
    } catch (error) {
      console.error('Error fetching Confluence spaces:', error);
      res.status(500).json({ error: 'Failed to fetch Confluence spaces' });
    }
  });

  // PUT /api/onboarding/settings - Update selected projects/spaces
  router.put('/settings', (req: Request, res: Response) => {
    try {
      const input: UpdateOnboardingSettingsInput = req.body;
      const updated = settingsCache.update(input);
      res.json(updated);
    } catch (error) {
      console.error('Error updating onboarding settings:', error);
      res.status(500).json({ error: 'Failed to update onboarding settings' });
    }
  });

  // POST /api/onboarding/complete - Mark onboarding as complete
  router.post('/complete', (_req: Request, res: Response) => {
    try {
      const settings = settingsCache.complete();
      res.json(settings);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      res.status(500).json({ error: 'Failed to complete onboarding' });
    }
  });

  // POST /api/onboarding/reset - Reset onboarding to allow re-configuration
  router.post('/reset', (_req: Request, res: Response) => {
    try {
      const settings = settingsCache.reset();
      res.json(settings);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      res.status(500).json({ error: 'Failed to reset onboarding' });
    }
  });

  return router;
}
