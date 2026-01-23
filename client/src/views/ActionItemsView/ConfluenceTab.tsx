import type { ConfluenceActionItem } from '../../types';
import { ActionItemCard } from './ActionItemCard';

interface ConfluenceTabProps {
  items: ConfluenceActionItem[];
  error?: string;
}

const CATEGORY_LABELS: Record<ConfluenceActionItem['category'], string> = {
  'mention': 'Mentions',
  'reply-needed': 'Replies Needed',
  'unresolved-comment': 'Unresolved Comments',
};

export function ConfluenceTab({ items, error }: ConfluenceTabProps): JSX.Element {
  if (error) {
    return (
      <div className="action-items-tab__error">
        <span className="action-items-tab__error-icon">!</span>
        <span>Error loading Confluence items: {error}</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="action-items-tab__empty">
        <div className="action-items-tab__empty-icon">C</div>
        <div className="action-items-tab__empty-text">No Confluence action items</div>
        <div className="action-items-tab__empty-subtext">
          No comments require your attention
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
  }, {} as Record<ConfluenceActionItem['category'], ConfluenceActionItem[]>);

  return (
    <div className="action-items-tab__content">
      {(Object.keys(CATEGORY_LABELS) as ConfluenceActionItem['category'][]).map((category) => {
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
