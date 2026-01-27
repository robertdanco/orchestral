import { useState, useCallback } from 'react';
import type { JiraActionSettings, JiraActionCategory, UpdateJiraActionSettingsInput } from '../../types';
import { JIRA_ACTION_CATEGORY_LABELS } from '../../types';
import './SettingsTab.css';

interface SettingsTabProps {
  settings: JiraActionSettings | null;
  loading: boolean;
  error: string | null;
  onUpdateSettings: (input: UpdateJiraActionSettingsInput) => Promise<JiraActionSettings>;
  onResetSettings: () => Promise<JiraActionSettings>;
  onSettingsChanged: () => void;
}

type StatusCategoryValue = 'todo' | 'inprogress';

const STATUS_CATEGORY_OPTIONS: { value: StatusCategoryValue; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'inprogress', label: 'In Progress' },
];

const ALL_CATEGORIES: JiraActionCategory[] = [
  'blocker',
  'blocked',
  'stale',
  'missingDetails',
  'unassigned',
  'unestimated',
];

export function SettingsTab({
  settings,
  loading,
  error,
  onUpdateSettings,
  onResetSettings,
  onSettingsChanged,
}: SettingsTabProps): JSX.Element {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const saveSettings = useCallback(async (
    action: () => Promise<unknown>,
    errorMessage = 'Failed to save'
  ): Promise<void> => {
    setSaving(true);
    setSaveError(null);
    try {
      await action();
      onSettingsChanged();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : errorMessage);
    } finally {
      setSaving(false);
    }
  }, [onSettingsChanged]);

  const handleStaleDaysChange = useCallback((value: number) => {
    if (value < 1 || value > 365) return;
    saveSettings(() => onUpdateSettings({ staleDays: value }));
  }, [onUpdateSettings, saveSettings]);

  const handleRequireEstimatesChange = useCallback((checked: boolean) => {
    saveSettings(() => onUpdateSettings({ requireEstimates: checked }));
  }, [onUpdateSettings, saveSettings]);

  const handleCategoryToggle = useCallback((category: JiraActionCategory, enabled: boolean) => {
    saveSettings(() => onUpdateSettings({ enabledCategories: { [category]: enabled } }));
  }, [onUpdateSettings, saveSettings]);

  const handleStatusMappingChange = useCallback((
    mapping: 'staleStatusCategories' | 'unassignedStatusCategories',
    categories: StatusCategoryValue[]
  ) => {
    saveSettings(() => onUpdateSettings({ statusMappings: { [mapping]: categories } }));
  }, [onUpdateSettings, saveSettings]);

  const handleReset = useCallback(() => {
    if (!window.confirm('Reset all settings to defaults?')) return;
    saveSettings(() => onResetSettings(), 'Failed to reset');
  }, [onResetSettings, saveSettings]);

  const toggleStatusCategory = useCallback((
    current: StatusCategoryValue[],
    value: StatusCategoryValue,
    checked: boolean
  ): StatusCategoryValue[] => {
    if (checked) {
      return [...current, value];
    }
    return current.filter(c => c !== value);
  }, []);

  if (loading && !settings) {
    return (
      <div className="settings-tab">
        <div className="settings-tab__loading">Loading settings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="settings-tab">
        <div className="settings-tab__error">Error loading settings: {error}</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="settings-tab">
        <div className="settings-tab__error">Settings not available</div>
      </div>
    );
  }

  return (
    <div className="settings-tab">
      <div className="settings-tab__header">
        <h2 className="settings-tab__title">Jira Detection Settings</h2>
        <button
          className="settings-tab__reset-btn"
          onClick={handleReset}
          disabled={saving}
        >
          Reset to Defaults
        </button>
      </div>

      {saveError && (
        <div className="settings-tab__save-error">{saveError}</div>
      )}

      <div className="settings-tab__section">
        <h3 className="settings-tab__section-title">Thresholds</h3>

        <div className="settings-tab__field">
          <label className="settings-tab__label" htmlFor="staleDays">
            Stale after (days)
          </label>
          <div className="settings-tab__input-row">
            <input
              id="staleDays"
              type="number"
              className="settings-tab__input settings-tab__input--number"
              value={settings.staleDays}
              onChange={(e) => handleStaleDaysChange(parseInt(e.target.value, 10))}
              min={1}
              max={365}
              disabled={saving}
            />
            <span className="settings-tab__input-hint">
              Issues without updates for this many days will appear in Stale Items
            </span>
          </div>
        </div>

        <div className="settings-tab__field">
          <label className="settings-tab__checkbox-label">
            <input
              type="checkbox"
              className="settings-tab__checkbox"
              checked={settings.requireEstimates}
              onChange={(e) => handleRequireEstimatesChange(e.target.checked)}
              disabled={saving}
            />
            <span className="settings-tab__checkbox-text">Require story estimates</span>
          </label>
          <span className="settings-tab__field-hint">
            When enabled, stories without story points will appear in Unestimated
          </span>
        </div>
      </div>

      <div className="settings-tab__section">
        <h3 className="settings-tab__section-title">Enabled Categories</h3>
        <p className="settings-tab__section-description">
          Choose which types of action items to detect
        </p>

        <div className="settings-tab__category-grid">
          {ALL_CATEGORIES.map((category) => (
            <label key={category} className="settings-tab__checkbox-label">
              <input
                type="checkbox"
                className="settings-tab__checkbox"
                checked={settings.enabledCategories[category]}
                onChange={(e) => handleCategoryToggle(category, e.target.checked)}
                disabled={saving}
              />
              <span className="settings-tab__checkbox-text">
                {JIRA_ACTION_CATEGORY_LABELS[category]}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="settings-tab__section">
        <h3 className="settings-tab__section-title">Status Mappings</h3>
        <p className="settings-tab__section-description">
          Configure which status categories trigger detections
        </p>

        <div className="settings-tab__field">
          <label className="settings-tab__label">Stale detection applies to:</label>
          <div className="settings-tab__multi-select">
            {STATUS_CATEGORY_OPTIONS.map((option) => (
              <label key={option.value} className="settings-tab__checkbox-label settings-tab__checkbox-label--inline">
                <input
                  type="checkbox"
                  className="settings-tab__checkbox"
                  checked={settings.statusMappings.staleStatusCategories.includes(option.value)}
                  onChange={(e) => {
                    const updated = toggleStatusCategory(
                      settings.statusMappings.staleStatusCategories,
                      option.value,
                      e.target.checked
                    );
                    handleStatusMappingChange('staleStatusCategories', updated);
                  }}
                  disabled={saving}
                />
                <span className="settings-tab__checkbox-text">{option.label}</span>
              </label>
            ))}
          </div>
          <span className="settings-tab__field-hint">
            Only issues in these status categories will be checked for staleness
          </span>
        </div>

        <div className="settings-tab__field">
          <label className="settings-tab__label">Unassigned detection applies to:</label>
          <div className="settings-tab__multi-select">
            {STATUS_CATEGORY_OPTIONS.map((option) => (
              <label key={option.value} className="settings-tab__checkbox-label settings-tab__checkbox-label--inline">
                <input
                  type="checkbox"
                  className="settings-tab__checkbox"
                  checked={settings.statusMappings.unassignedStatusCategories.includes(option.value)}
                  onChange={(e) => {
                    const updated = toggleStatusCategory(
                      settings.statusMappings.unassignedStatusCategories,
                      option.value,
                      e.target.checked
                    );
                    handleStatusMappingChange('unassignedStatusCategories', updated);
                  }}
                  disabled={saving}
                />
                <span className="settings-tab__checkbox-text">{option.label}</span>
              </label>
            ))}
          </div>
          <span className="settings-tab__field-hint">
            Only issues in these status categories will be flagged if unassigned
          </span>
        </div>
      </div>

      {saving && (
        <div className="settings-tab__saving-indicator">Saving...</div>
      )}
    </div>
  );
}
