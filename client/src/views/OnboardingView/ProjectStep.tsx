import { useEffect, useState } from 'react';
import type { JiraProjectInfo } from '../../types';

interface ProjectStepProps {
  projects: JiraProjectInfo[];
  selectedKeys: string[];
  envSuggestedKeys: string[];
  loading: boolean;
  onFetchProjects: () => Promise<JiraProjectInfo[]>;
  onSelectionChange: (keys: string[]) => void;
}

export function ProjectStep({
  projects,
  selectedKeys,
  envSuggestedKeys,
  loading,
  onFetchProjects,
  onSelectionChange,
}: ProjectStepProps): JSX.Element {
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!fetched && projects.length === 0) {
      setFetched(true);
      onFetchProjects().then(fetchedProjects => {
        // Pre-select env var suggestions if no selection yet
        if (selectedKeys.length === 0 && envSuggestedKeys.length > 0) {
          const validKeys = envSuggestedKeys.filter(key =>
            fetchedProjects.some(p => p.key === key)
          );
          if (validKeys.length > 0) {
            onSelectionChange(validKeys);
          }
        }
      });
    }
  }, [fetched, projects.length, selectedKeys.length, envSuggestedKeys, onFetchProjects, onSelectionChange]);

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
          <p className="onboarding-step__loading-text">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="onboarding-step">
        <div className="onboarding-step__empty">
          <div className="onboarding-step__empty-icon">?</div>
          <p className="onboarding-step__empty-text">No projects found</p>
          <p className="onboarding-step__empty-subtext">
            Make sure your API credentials have access to at least one Jira project.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-step">
      <p className="onboarding-step__selection-count">
        {selectedKeys.length} of {projects.length} projects selected
      </p>

      <div className="onboarding-step__list">
        {projects.map(project => (
          <div
            key={project.key}
            className={`onboarding-step__list-item ${
              selectedKeys.includes(project.key) ? 'onboarding-step__list-item--selected' : ''
            }`}
            onClick={() => handleToggle(project.key)}
          >
            <div className="onboarding-step__list-item-checkbox">
              {selectedKeys.includes(project.key) && '✓'}
            </div>
            {project.avatarUrl && (
              <img
                src={project.avatarUrl}
                alt=""
                className="onboarding-step__list-item-avatar"
              />
            )}
            <div className="onboarding-step__list-item-info">
              <p className="onboarding-step__list-item-name">{project.name}</p>
              <span className="onboarding-step__list-item-key">{project.key}</span>
            </div>
            {envSuggestedKeys.includes(project.key) && (
              <span className="onboarding-step__list-item-badge">From .env</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
