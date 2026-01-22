import { Router } from 'express';
import { Cache } from './cache.js';
import { JiraClient } from './jira/client.js';
import { buildHierarchy } from './hierarchy.js';
import { detectActionRequired, DEFAULT_ACTION_CONFIG } from './actions.js';

export function createRouter(cache: Cache, client: JiraClient): Router {
  const router = Router();

  // Ensure cache is populated
  async function ensureCache(): Promise<void> {
    if (cache.getIssues().length === 0) {
      const issues = await client.fetchIssues();
      cache.setIssues(issues);
    }
  }

  // GET /api/issues - List all issues
  router.get('/issues', async (_req, res) => {
    try {
      await ensureCache();
      res.json({
        issues: cache.getIssues(),
        lastRefreshed: cache.getLastRefreshed(),
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /api/issues/:key - Single issue
  router.get('/issues/:key', async (req, res) => {
    try {
      await ensureCache();
      const issue = cache.getIssue(req.params.key);
      if (!issue) {
        res.status(404).json({ error: 'Issue not found' });
        return;
      }
      res.json(issue);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // POST /api/refresh - Clear cache and refetch
  router.post('/refresh', async (_req, res) => {
    try {
      cache.clear();
      const issues = await client.fetchIssues();
      cache.setIssues(issues);
      res.json({
        message: 'Refreshed',
        count: issues.length,
        lastRefreshed: cache.getLastRefreshed(),
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /api/hierarchy - Hierarchical tree
  router.get('/hierarchy', async (_req, res) => {
    try {
      await ensureCache();
      const hierarchy = buildHierarchy(cache.getIssues());
      res.json(hierarchy);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /api/actions - Action required items
  router.get('/actions', async (_req, res) => {
    try {
      await ensureCache();
      const actions = detectActionRequired(cache.getIssues(), DEFAULT_ACTION_CONFIG);
      res.json(actions);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /api/config - Public config (no secrets)
  router.get('/config', (_req, res) => {
    res.json({
      projectKeys: client.getProjectKeys(),
      actionConfig: DEFAULT_ACTION_CONFIG,
    });
  });

  return router;
}
