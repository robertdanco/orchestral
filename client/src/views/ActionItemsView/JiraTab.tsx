import type { JiraActionItem } from '../../types';
import { ActionItemCard } from './ActionItemCard';

interface JiraTabProps {
  items: JiraActionItem[];
  error?: string;
  onSelectIssue: (issueKey: string) => void;
}

const CATEGORY_LABELS: Record<JiraActionItem['category'], string> = {
  blocker: 'Blockers',
  blocked: 'Blocked',
  stale: 'Stale',
  missingDetails: 'Missing Details',
  unassigned: 'Unassigned',
  unestimated: 'Unestimated',
};

export function JiraTab({ items, error, onSelectIssue }: JiraTabProps): JSX.Element {
  if (error) {
    return (
      <div className="action-items-tab__error">
        <span className="action-items-tab__error-icon">!</span>
        <span>Error loading Jira items: {error}</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="action-items-tab__empty">
        <div className="action-items-tab__empty-icon">J</div>
        <div className="action-items-tab__empty-text">No Jira action items</div>
        <div className="action-items-tab__empty-subtext">
          All Jira issues are in good shape
        </div>
      </div>
    );
  }

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<JiraActionItem['category'], JiraActionItem[]>);

  return (
    <div className="action-items-tab__content">
      {(Object.keys(CATEGORY_LABELS) as JiraActionItem['category'][]).map((category) => {
        const categoryItems = groupedItems[category] || [];
        if (categoryItems.length === 0) return null;

        return (
          <div key={category} className="action-items-tab__section">
            <h3 className="action-items-tab__section-title">
              {CATEGORY_LABELS[category]}
              <span className="action-items-tab__section-count">{categoryItems.length}</span>
            </h3>
            <div className="action-items-tab__list">
              {categoryItems.map((item) => (
                <ActionItemCard
                  key={item.id}
                  item={item}
                  onSelectJiraIssue={onSelectIssue}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
