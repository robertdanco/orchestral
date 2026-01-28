import { useEffect, useState } from 'react';
import type { JiraStatusInfo } from '../../types';

interface StatusStepProps {
  statuses: JiraStatusInfo[];
  loading: boolean;
  onFetchStatuses: () => Promise<JiraStatusInfo[]>;
}

const CATEGORY_LABELS: Record<string, string> = {
  todo: 'To Do',
  inprogress: 'In Progress',
  done: 'Done',
};

export function StatusStep({
  statuses,
  loading,
  onFetchStatuses,
}: StatusStepProps): JSX.Element {
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!fetched && statuses.length === 0) {
      setFetched(true);
      onFetchStatuses();
    }
  }, [fetched, statuses.length, onFetchStatuses]);

  if (loading) {
    return (
      <div className="onboarding-step">
        <div className="onboarding-step__loading">
          <div className="onboarding-step__loading-spinner" />
          <p className="onboarding-step__loading-text">Loading workflow statuses...</p>
        </div>
      </div>
    );
  }

  if (statuses.length === 0) {
    return (
      <div className="onboarding-step">
        <div className="onboarding-step__empty">
          <div className="onboarding-step__empty-icon">?</div>
          <p className="onboarding-step__empty-text">No statuses found</p>
          <p className="onboarding-step__empty-subtext">
            Could not load workflow statuses from Jira.
          </p>
        </div>
      </div>
    );
  }

  // Group statuses by category
  const byCategory = statuses.reduce((acc, status) => {
    if (!acc[status.category]) {
      acc[status.category] = [];
    }
    acc[status.category].push(status);
    return acc;
  }, {} as Record<string, JiraStatusInfo[]>);

  const categoryOrder: Array<'todo' | 'inprogress' | 'done'> = ['todo', 'inprogress', 'done'];

  return (
    <div className="onboarding-step">
      <div className="onboarding-step__info">
        <div className="onboarding-step__info-icon">i</div>
        <p className="onboarding-step__info-text">
          These are the workflow statuses detected in your Jira instance.
          Orchestral uses Jira's built-in status categories to organize issues.
        </p>
      </div>

      <div className="onboarding-step__status-list">
        {categoryOrder.map(category => {
          const categoryStatuses = byCategory[category] || [];
          if (categoryStatuses.length === 0) return null;

          return (
            <div key={category} className="onboarding-step__status-category">
              <h3 className="onboarding-step__status-category-title">
                <span className={`onboarding-step__status-category-badge onboarding-step__status-category-badge--${category}`} />
                {CATEGORY_LABELS[category]}
              </h3>
              <div className="onboarding-step__status-items">
                {categoryStatuses.map(status => (
                  <span key={status.id} className="onboarding-step__status-item">
                    {status.name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
