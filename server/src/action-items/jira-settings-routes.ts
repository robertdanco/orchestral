import { Router, type Request, type Response } from 'express';
import type { UpdateJiraActionSettingsInput } from '@orchestral/shared';
import type { JiraSettingsCache } from './jira-settings-cache.js';

const VALID_STATUS_CATEGORIES = ['todo', 'inprogress'] as const;

function isValidStatusCategoryArray(arr: unknown): boolean {
  return Array.isArray(arr) && arr.every(c => VALID_STATUS_CATEGORIES.includes(c as typeof VALID_STATUS_CATEGORIES[number]));
}

function validateInput(input: UpdateJiraActionSettingsInput): string | null {
  if (input.staleDays !== undefined) {
    if (typeof input.staleDays !== 'number' || input.staleDays < 1 || input.staleDays > 365) {
      return 'staleDays must be a number between 1 and 365';
    }
  }

  if (input.requireEstimates !== undefined && typeof input.requireEstimates !== 'boolean') {
    return 'requireEstimates must be a boolean';
  }

  if (input.statusMappings) {
    const { staleStatusCategories, unassignedStatusCategories } = input.statusMappings;
    if (staleStatusCategories && !isValidStatusCategoryArray(staleStatusCategories)) {
      return 'staleStatusCategories must be an array of "todo" and/or "inprogress"';
    }
    if (unassignedStatusCategories && !isValidStatusCategoryArray(unassignedStatusCategories)) {
      return 'unassignedStatusCategories must be an array of "todo" and/or "inprogress"';
    }
  }

  return null;
}

export function createJiraSettingsRouter(settingsCache: JiraSettingsCache): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    res.json(settingsCache.get());
  });

  router.put('/', (req: Request, res: Response) => {
    const input: UpdateJiraActionSettingsInput = req.body;
    const validationError = validateInput(input);

    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    res.json(settingsCache.update(input));
  });

  router.post('/reset', (_req: Request, res: Response) => {
    res.json(settingsCache.reset());
  });

  return router;
}
