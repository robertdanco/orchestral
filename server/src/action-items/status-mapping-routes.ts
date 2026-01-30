import { Router, type Request, type Response } from 'express';
import type { UpdateStatusMappingInput, DisplayStatus, StatusCategory } from '@orchestral/shared';
import { ALL_DISPLAY_STATUSES } from '@orchestral/shared';
import type { StatusMappingCache } from './status-mapping-cache.js';
import type { JiraClient } from '../jira/client.js';

const VALID_DISPLAY_STATUSES = new Set<string>(ALL_DISPLAY_STATUSES);
const VALID_STATUS_CATEGORIES = new Set<string>(['todo', 'inprogress', 'done']);

function isValidDisplayStatus(status: unknown): status is DisplayStatus {
  return typeof status === 'string' && VALID_DISPLAY_STATUSES.has(status);
}

function isValidStatusCategory(category: unknown): category is StatusCategory {
  return typeof category === 'string' && VALID_STATUS_CATEGORIES.has(category);
}

function validateInput(input: UpdateStatusMappingInput): string | null {
  if (input.statusToDisplay !== undefined) {
    if (typeof input.statusToDisplay !== 'object' || input.statusToDisplay === null) {
      return 'statusToDisplay must be an object';
    }
    for (const [key, value] of Object.entries(input.statusToDisplay)) {
      if (typeof key !== 'string' || key.trim() === '') {
        return 'statusToDisplay keys must be non-empty strings';
      }
      if (!isValidDisplayStatus(value)) {
        return `Invalid display status "${value}" for key "${key}"`;
      }
    }
  }

  if (input.categoryDefaults !== undefined) {
    if (typeof input.categoryDefaults !== 'object' || input.categoryDefaults === null) {
      return 'categoryDefaults must be an object';
    }
    for (const [key, value] of Object.entries(input.categoryDefaults)) {
      if (!isValidStatusCategory(key)) {
        return `Invalid status category "${key}"`;
      }
      if (!isValidDisplayStatus(value)) {
        return `Invalid display status "${value}" for category "${key}"`;
      }
    }
  }

  return null;
}

export function createStatusMappingRouter(
  cache: StatusMappingCache,
  jiraClient?: JiraClient
): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    res.json(cache.get());
  });

  router.put('/', (req: Request, res: Response) => {
    const input: UpdateStatusMappingInput = req.body;
    const validationError = validateInput(input);

    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const updatedMappings = cache.update(input);
    if (jiraClient) {
      jiraClient.setStatusMappings(updatedMappings);
    }
    res.json(updatedMappings);
  });

  router.post('/reset', (_req: Request, res: Response) => {
    const defaultMappings = cache.reset();
    if (jiraClient) {
      jiraClient.setStatusMappings(defaultMappings);
    }
    res.json(defaultMappings);
  });

  return router;
}
