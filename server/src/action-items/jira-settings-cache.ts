import fs from 'fs';
import path from 'path';
import type { JiraActionSettings, UpdateJiraActionSettingsInput } from '@orchestral/shared';
import { DEFAULT_JIRA_ACTION_SETTINGS } from '@orchestral/shared';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'jira-settings.json');

export class JiraSettingsCache {
  private settings: JiraActionSettings;

  constructor() {
    this.settings = { ...DEFAULT_JIRA_ACTION_SETTINGS };
    this.ensureDataDir();
    this.load();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): void {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        const loaded: Partial<JiraActionSettings> = JSON.parse(data);
        // Merge with defaults to ensure all fields exist
        this.settings = this.mergeWithDefaults(loaded);
      }
    } catch (error) {
      console.error('Error loading Jira settings cache:', error);
      this.settings = { ...DEFAULT_JIRA_ACTION_SETTINGS };
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.settings, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving Jira settings cache:', error);
    }
  }

  private mergeWithDefaults(partial: Partial<JiraActionSettings>): JiraActionSettings {
    return {
      staleDays: partial.staleDays ?? DEFAULT_JIRA_ACTION_SETTINGS.staleDays,
      requireEstimates: partial.requireEstimates ?? DEFAULT_JIRA_ACTION_SETTINGS.requireEstimates,
      enabledCategories: {
        ...DEFAULT_JIRA_ACTION_SETTINGS.enabledCategories,
        ...partial.enabledCategories,
      },
      statusMappings: {
        staleStatusCategories: partial.statusMappings?.staleStatusCategories ??
          DEFAULT_JIRA_ACTION_SETTINGS.statusMappings.staleStatusCategories,
        unassignedStatusCategories: partial.statusMappings?.unassignedStatusCategories ??
          DEFAULT_JIRA_ACTION_SETTINGS.statusMappings.unassignedStatusCategories,
      },
    };
  }

  get(): JiraActionSettings {
    return { ...this.settings };
  }

  update(input: UpdateJiraActionSettingsInput): JiraActionSettings {
    // Merge input with existing settings
    this.settings = {
      staleDays: input.staleDays ?? this.settings.staleDays,
      requireEstimates: input.requireEstimates ?? this.settings.requireEstimates,
      enabledCategories: {
        ...this.settings.enabledCategories,
        ...input.enabledCategories,
      },
      statusMappings: {
        staleStatusCategories: input.statusMappings?.staleStatusCategories ??
          this.settings.statusMappings.staleStatusCategories,
        unassignedStatusCategories: input.statusMappings?.unassignedStatusCategories ??
          this.settings.statusMappings.unassignedStatusCategories,
      },
    };

    this.save();
    return this.get();
  }

  reset(): JiraActionSettings {
    this.settings = { ...DEFAULT_JIRA_ACTION_SETTINGS };
    this.save();
    return this.get();
  }
}
