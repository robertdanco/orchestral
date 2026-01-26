import type { ActionItem } from '../../types';
import { EmptyState, type EmptyStateConfig } from '../../components/EmptyState';
import { ActionItemCard } from './ActionItemCard';
import { groupByCategory } from './utils';

interface ActionItemsTabProps<T extends ActionItem> {
  items: T[];
  error?: string;
  categoryLabels: Record<string, string>;
  emptyState: EmptyStateConfig;
  errorPrefix: string;
  onSelectJiraIssue?: (issueKey: string) => void;
}

export function ActionItemsTab<T extends ActionItem>({
  items,
  error,
  categoryLabels,
  emptyState,
  errorPrefix,
  onSelectJiraIssue,
}: ActionItemsTabProps<T>): JSX.Element {
  if (error) {
    return (
      <div className="action-items-tab__error">
        <span className="action-items-tab__error-icon">!</span>
        <span>{errorPrefix}: {error}</span>
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyState {...emptyState} />;
  }

  const groupedItems = groupByCategory(items);
  const categories = Object.keys(categoryLabels) as T['category'][];

  return (
    <div className="action-items-tab__content">
      {categories.map((category) => {
        const categoryItems = groupedItems[category] || [];
        if (categoryItems.length === 0) return null;

        return (
          <div key={category} className="action-items-tab__section">
            <h3 className="action-items-tab__section-title">
              {categoryLabels[category]}
              <span className="action-items-tab__section-count">{categoryItems.length}</span>
            </h3>
            <div className="action-items-tab__list">
              {categoryItems.map((item) => (
                <ActionItemCard
                  key={item.id}
                  item={item}
                  onSelectJiraIssue={onSelectJiraIssue}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
