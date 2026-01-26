import type { SlackActionItem } from '../../types';
import { ActionItemCard } from './ActionItemCard';
import { SLACK_CATEGORY_LABELS as CATEGORY_LABELS, groupByCategory } from './utils';

interface SlackTabProps {
  items: SlackActionItem[];
  error?: string;
}

export function SlackTab({ items, error }: SlackTabProps): JSX.Element {
  if (error) {
    return (
      <div className="action-items-tab__error">
        <span className="action-items-tab__error-icon">!</span>
        <span>Error loading Slack items: {error}</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="action-items-tab__empty">
        <div className="action-items-tab__empty-icon">#</div>
        <div className="action-items-tab__empty-text">No Slack action items</div>
        <div className="action-items-tab__empty-subtext">
          No mentions or thread replies require your attention
        </div>
      </div>
    );
  }

  const groupedItems = groupByCategory(items);

  return (
    <div className="action-items-tab__content">
      {(Object.keys(CATEGORY_LABELS) as SlackActionItem['category'][]).map((category) => {
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
                <ActionItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
