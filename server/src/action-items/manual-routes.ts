import { Router, type Request, type Response } from 'express';
import type { CreateManualActionItemInput, UpdateManualActionItemInput } from '@orchestral/shared';
import type { ManualItemsCache } from './manual-cache.js';

const VALID_CATEGORIES = ['task', 'followup', 'decision', 'reminder'] as const;
const VALID_PRIORITIES = ['high', 'medium', 'low'] as const;

export function createManualItemsRouter(cache: ManualItemsCache): Router {
  const router = Router();

  // GET /api/action-items/manual - List all manual items
  router.get('/', (_req: Request, res: Response) => {
    const items = cache.getAll();
    res.json({ items, count: items.length });
  });

  // POST /api/action-items/manual - Create new manual item
  router.post('/', (req: Request, res: Response) => {
    const input = req.body as CreateManualActionItemInput;

    // Validate required fields
    if (!input.title || !input.reason || !input.category || !input.priority) {
      res.status(400).json({ error: 'Missing required fields: title, reason, category, priority' });
      return;
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(input.category as typeof VALID_CATEGORIES[number])) {
      res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
      return;
    }

    // Validate priority
    if (!VALID_PRIORITIES.includes(input.priority as typeof VALID_PRIORITIES[number])) {
      res.status(400).json({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` });
      return;
    }

    const item = cache.create(input);
    res.status(201).json(item);
  });

  // GET /api/action-items/manual/:id - Get single item
  router.get('/:id', (req: Request, res: Response) => {
    const item = cache.get(req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    res.json(item);
  });

  // PUT /api/action-items/manual/:id - Update item
  router.put('/:id', (req: Request, res: Response) => {
    const input = req.body as UpdateManualActionItemInput;

    // Validate category if provided
    if (input.category && !VALID_CATEGORIES.includes(input.category as typeof VALID_CATEGORIES[number])) {
      res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
      return;
    }

    // Validate priority if provided
    if (input.priority && !VALID_PRIORITIES.includes(input.priority as typeof VALID_PRIORITIES[number])) {
      res.status(400).json({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` });
      return;
    }

    const item = cache.update(req.params.id, input);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    res.json(item);
  });

  // DELETE /api/action-items/manual/:id - Delete item
  router.delete('/:id', (req: Request, res: Response) => {
    const deleted = cache.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    res.status(204).send();
  });

  // POST /api/action-items/manual/:id/complete - Mark item as complete
  router.post('/:id/complete', (req: Request, res: Response) => {
    const item = cache.markComplete(req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    res.json(item);
  });

  // POST /api/action-items/manual/:id/incomplete - Mark item as incomplete
  router.post('/:id/incomplete', (req: Request, res: Response) => {
    const item = cache.markIncomplete(req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    res.json(item);
  });

  return router;
}
