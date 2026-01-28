import fs from 'fs';
import path from 'path';
import type { OnboardingSettings, UpdateOnboardingSettingsInput } from '@orchestral/shared';
import { DEFAULT_ONBOARDING_SETTINGS } from '@orchestral/shared';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'onboarding-settings.json');

export class OnboardingSettingsCache {
  private settings: OnboardingSettings;

  constructor() {
    this.settings = { ...DEFAULT_ONBOARDING_SETTINGS };
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
        const loaded: Partial<OnboardingSettings> = JSON.parse(data);
        this.settings = this.mergeWithDefaults(loaded);
      }
    } catch (error) {
      console.error('Error loading onboarding settings cache:', error);
      this.settings = { ...DEFAULT_ONBOARDING_SETTINGS };
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.settings, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving onboarding settings cache:', error);
    }
  }

  private mergeWithDefaults(partial: Partial<OnboardingSettings>): OnboardingSettings {
    return {
      selectedProjectKeys: partial.selectedProjectKeys ?? DEFAULT_ONBOARDING_SETTINGS.selectedProjectKeys,
      selectedSpaceKeys: partial.selectedSpaceKeys ?? DEFAULT_ONBOARDING_SETTINGS.selectedSpaceKeys,
      completedAt: partial.completedAt ?? DEFAULT_ONBOARDING_SETTINGS.completedAt,
    };
  }

  get(): OnboardingSettings {
    return { ...this.settings };
  }

  update(input: UpdateOnboardingSettingsInput): OnboardingSettings {
    this.settings = {
      selectedProjectKeys: input.selectedProjectKeys ?? this.settings.selectedProjectKeys,
      selectedSpaceKeys: input.selectedSpaceKeys ?? this.settings.selectedSpaceKeys,
      completedAt: this.settings.completedAt,
    };

    this.save();
    return this.get();
  }

  complete(): OnboardingSettings {
    this.settings = {
      ...this.settings,
      completedAt: new Date().toISOString(),
    };

    this.save();
    return this.get();
  }

  reset(): OnboardingSettings {
    this.settings = { ...DEFAULT_ONBOARDING_SETTINGS };
    this.save();
    return this.get();
  }

  isComplete(): boolean {
    return this.settings.completedAt !== null;
  }

  getSelectedProjectKeys(): string[] {
    return [...this.settings.selectedProjectKeys];
  }

  getSelectedSpaceKeys(): string[] {
    return [...this.settings.selectedSpaceKeys];
  }
}
