import { Router } from 'express';
import { ConfluenceCache } from './confluence/cache.js';
import { ConfluenceClient } from './confluence/client.js';
import { buildSpaceHierarchy } from './confluence/hierarchy.js';

export function createConfluenceRouter(
  cache: ConfluenceCache,
  client: ConfluenceClient
): Router {
  const router = Router();

  // Ensure cache is populated
  async function ensureCache(): Promise<void> {
    if (cache.isEmpty()) {
      const spaces = await client.fetchSpaces();
      cache.setSpaces(spaces);

      // Fetch pages for each space
      const allPages = [];
      for (const space of spaces) {
        const pages = await client.fetchPages(space.id);
        // Add space key to pages
        for (const page of pages) {
          page.spaceKey = space.key;
        }
        allPages.push(...pages);
      }
      cache.setPages(allPages);
    }
  }

  // GET /api/confluence/spaces - List all spaces
  router.get('/spaces', async (_req, res) => {
    try {
      await ensureCache();
      res.json({
        spaces: cache.getSpaces(),
        lastRefreshed: cache.getLastRefreshed(),
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /api/confluence/pages - List all pages
  router.get('/pages', async (_req, res) => {
    try {
      await ensureCache();
      res.json({
        pages: cache.getPages(),
        lastRefreshed: cache.getLastRefreshed(),
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /api/confluence/pages/:id - Single page with full content
  router.get('/pages/:id', async (req, res) => {
    try {
      await ensureCache();

      // Check if we have detailed content cached
      let page = cache.getPage(req.params.id);

      if (!page) {
        res.status(404).json({ error: 'Page not found' });
        return;
      }

      // Fetch full content if not cached with details
      const cachedDetail = cache.getPage(req.params.id);
      if (!cachedDetail || !cachedDetail.body) {
        try {
          const fullPage = await client.fetchPage(req.params.id);
          // Preserve space key from cached page
          fullPage.spaceKey = page.spaceKey;
          cache.setPageDetail(req.params.id, fullPage);
          page = fullPage;
        } catch {
          // Use cached version if fetch fails
        }
      }

      res.json(page);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /api/confluence/hierarchy - Spaces with nested page trees
  router.get('/hierarchy', async (_req, res) => {
    try {
      await ensureCache();
      const hierarchy = buildSpaceHierarchy(cache.getSpaces(), cache.getPages());
      res.json({
        spaces: hierarchy,
        lastRefreshed: cache.getLastRefreshed(),
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /api/confluence/search - Search pages by content
  router.get('/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        res.status(400).json({ error: 'Query parameter "q" is required' });
        return;
      }

      const spaceKeys = req.query.spaces
        ? (req.query.spaces as string).split(',')
        : undefined;

      const pages = await client.searchPages(query, spaceKeys);
      res.json({
        pages,
        total: pages.length,
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // POST /api/confluence/refresh - Clear cache and refetch
  router.post('/refresh', async (_req, res) => {
    try {
      cache.clear();

      const spaces = await client.fetchSpaces();
      cache.setSpaces(spaces);

      const allPages = [];
      for (const space of spaces) {
        const pages = await client.fetchPages(space.id);
        for (const page of pages) {
          page.spaceKey = space.key;
        }
        allPages.push(...pages);
      }
      cache.setPages(allPages);

      res.json({
        message: 'Refreshed',
        spacesCount: spaces.length,
        pagesCount: allPages.length,
        lastRefreshed: cache.getLastRefreshed(),
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  return router;
}
