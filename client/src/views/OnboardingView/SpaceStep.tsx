import { useEffect, useState } from 'react';
import type { ConfluenceSpaceInfo } from '../../types';

interface SpaceStepProps {
  spaces: ConfluenceSpaceInfo[];
  selectedKeys: string[];
  confluenceAvailable: boolean;
  loading: boolean;
  onFetchSpaces: () => Promise<{ spaces: ConfluenceSpaceInfo[]; available: boolean }>;
  onSelectionChange: (keys: string[]) => void;
}

export function SpaceStep({
  spaces,
  selectedKeys,
  confluenceAvailable,
  loading,
  onFetchSpaces,
  onSelectionChange,
}: SpaceStepProps): JSX.Element {
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!fetched && spaces.length === 0) {
      setFetched(true);
      onFetchSpaces();
    }
  }, [fetched, spaces.length, onFetchSpaces]);

  function handleToggle(key: string): void {
    const newKeys = selectedKeys.includes(key)
      ? selectedKeys.filter(k => k !== key)
      : [...selectedKeys, key];
    onSelectionChange(newKeys);
  }

  if (loading) {
    return (
      <div className="onboarding-step">
        <div className="onboarding-step__loading">
          <div className="onboarding-step__loading-spinner" />
          <p className="onboarding-step__loading-text">Loading Confluence spaces...</p>
        </div>
      </div>
    );
  }

  if (!confluenceAvailable) {
    return (
      <div className="onboarding-step">
        <div className="onboarding-step__empty">
          <div className="onboarding-step__empty-icon">-</div>
          <p className="onboarding-step__empty-text">Confluence not available</p>
          <p className="onboarding-step__empty-subtext">
            Confluence integration is not configured. You can skip this step.
          </p>
        </div>
      </div>
    );
  }

  if (spaces.length === 0) {
    return (
      <div className="onboarding-step">
        <div className="onboarding-step__empty">
          <div className="onboarding-step__empty-icon">?</div>
          <p className="onboarding-step__empty-text">No spaces found</p>
          <p className="onboarding-step__empty-subtext">
            Make sure your API credentials have access to at least one Confluence space.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-step">
      <div className="onboarding-step__info">
        <div className="onboarding-step__info-icon">i</div>
        <p className="onboarding-step__info-text">
          Select Confluence spaces to include in searches and action item detection.
          Leave empty to skip Confluence integration.
        </p>
      </div>

      <p className="onboarding-step__selection-count">
        {selectedKeys.length} of {spaces.length} spaces selected
      </p>

      <div className="onboarding-step__list">
        {spaces.map(space => (
          <div
            key={space.key}
            className={`onboarding-step__list-item ${
              selectedKeys.includes(space.key) ? 'onboarding-step__list-item--selected' : ''
            }`}
            onClick={() => handleToggle(space.key)}
          >
            <div className="onboarding-step__list-item-checkbox">
              {selectedKeys.includes(space.key) && '✓'}
            </div>
            <div className="onboarding-step__list-item-info">
              <p className="onboarding-step__list-item-name">{space.name}</p>
              <span className="onboarding-step__list-item-key">{space.key}</span>
            </div>
            <span className="onboarding-step__list-item-badge">{space.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
