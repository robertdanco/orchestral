import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import { JiraSettingsCache } from './jira-settings-cache.js';
import { DEFAULT_JIRA_ACTION_SETTINGS } from '@orchestral/shared';

// Mock fs module
vi.mock('fs');

describe('JiraSettingsCache', () => {
  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.mkdirSync).mockImplementation(() => undefined);
    vi.mocked(fs.writeFileSync).mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('returns default settings when no file exists', () => {
      const cache = new JiraSettingsCache();
      const settings = cache.get();

      expect(settings).toEqual(DEFAULT_JIRA_ACTION_SETTINGS);
    });

    it('loads settings from file when it exists', () => {
      const savedSettings = {
        staleDays: 10,
        requireEstimates: false,
        enabledCategories: {
          blocker: true,
          blocked: false,
          stale: true,
          missingDetails: false,
          unassigned: true,
          unestimated: false,
        },
        statusMappings: {
          staleStatusCategories: ['todo'],
          unassignedStatusCategories: ['inprogress'],
        },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(savedSettings));

      const cache = new JiraSettingsCache();
      const settings = cache.get();

      expect(settings.staleDays).toBe(10);
      expect(settings.requireEstimates).toBe(false);
      expect(settings.enabledCategories.blocked).toBe(false);
    });

    it('merges partial saved settings with defaults', () => {
      const partialSettings = {
        staleDays: 7,
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(partialSettings));

      const cache = new JiraSettingsCache();
      const settings = cache.get();

      expect(settings.staleDays).toBe(7);
      expect(settings.requireEstimates).toBe(DEFAULT_JIRA_ACTION_SETTINGS.requireEstimates);
      expect(settings.enabledCategories).toEqual(DEFAULT_JIRA_ACTION_SETTINGS.enabledCategories);
    });
  });

  describe('update', () => {
    it('updates staleDays and saves to file', () => {
      const cache = new JiraSettingsCache();
      const updated = cache.update({ staleDays: 10 });

      expect(updated.staleDays).toBe(10);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('updates requireEstimates', () => {
      const cache = new JiraSettingsCache();
      const updated = cache.update({ requireEstimates: false });

      expect(updated.requireEstimates).toBe(false);
    });

    it('partially updates enabledCategories', () => {
      const cache = new JiraSettingsCache();
      const updated = cache.update({ enabledCategories: { stale: false } });

      expect(updated.enabledCategories.stale).toBe(false);
      expect(updated.enabledCategories.blocker).toBe(true); // unchanged
    });

    it('updates statusMappings', () => {
      const cache = new JiraSettingsCache();
      const updated = cache.update({
        statusMappings: { staleStatusCategories: ['todo', 'inprogress'] },
      });

      expect(updated.statusMappings.staleStatusCategories).toEqual(['todo', 'inprogress']);
    });
  });

  describe('reset', () => {
    it('resets to default settings', () => {
      const cache = new JiraSettingsCache();

      // First modify settings
      cache.update({ staleDays: 20, requireEstimates: false });

      // Then reset
      const reset = cache.reset();

      expect(reset).toEqual(DEFAULT_JIRA_ACTION_SETTINGS);
    });

    it('saves reset settings to file', () => {
      const cache = new JiraSettingsCache();
      cache.reset();

      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });
});
