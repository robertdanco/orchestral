// Onboarding types for project/space discovery and configuration

export interface JiraProjectInfo {
  key: string;
  name: string;
  avatarUrl?: string;
}

export interface JiraStatusInfo {
  id: string;
  name: string;
  category: 'todo' | 'inprogress' | 'done';
}

export interface ConfluenceSpaceInfo {
  key: string;
  name: string;
  type: 'global' | 'personal';
}

export interface OnboardingSettings {
  selectedProjectKeys: string[];
  selectedSpaceKeys: string[];
  completedAt: string | null;
}

export interface OnboardingStatus {
  isComplete: boolean;
  settings: OnboardingSettings;
}

export interface UpdateOnboardingSettingsInput {
  selectedProjectKeys?: string[];
  selectedSpaceKeys?: string[];
}

export const DEFAULT_ONBOARDING_SETTINGS: OnboardingSettings = {
  selectedProjectKeys: [],
  selectedSpaceKeys: [],
  completedAt: null,
};
