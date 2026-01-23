import type { JiraActionItem } from '../../types';
import { ActionItemCard } from './ActionItemCard';
import { JIRA_CATEGORY_LABELS as CATEGORY_LABELS, groupByCategory } from './utils';

interface JiraTabProps {
  items: JiraActionItem[];
  error?: string;
  onSelectIssue: (issueKey: string) => void;
}

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

  const groupedItems = groupByCategory(items);

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
