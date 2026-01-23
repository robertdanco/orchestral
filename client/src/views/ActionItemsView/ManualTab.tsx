import type { ManualActionItem } from '../../types';
import { ActionItemCard } from './ActionItemCard';
import { MANUAL_CATEGORY_LABELS as CATEGORY_LABELS, groupByCategory } from './utils';

interface ManualTabProps {
  items: ManualActionItem[];
  error?: string;
  onAddNew: () => void;
  onEditItem: (item: ManualActionItem) => void;
  onDeleteItem: (id: string) => void;
  onCompleteItem: (id: string) => void;
  onUncompleteItem: (id: string) => void;
}

export function ManualTab({
  items,
  error,
  onAddNew,
  onEditItem,
  onDeleteItem,
  onCompleteItem,
  onUncompleteItem,
}: ManualTabProps): JSX.Element {
  if (error) {
    return (
      <div className="action-items-tab__error">
        <span className="action-items-tab__error-icon">!</span>
        <span>Error loading manual items: {error}</span>
      </div>
    );
  }

  // Separate completed and active items
  const activeItems = items.filter((item) => !item.completedAt);
  const completedItems = items.filter((item) => item.completedAt);

  const groupedActiveItems = groupByCategory(activeItems);

  return (
    <div className="action-items-tab__content">
      <div className="manual-tab__header">
        <button className="manual-tab__add-btn" onClick={onAddNew}>
          + Add New Item
        </button>
      </div>

      {activeItems.length === 0 && completedItems.length === 0 && (
        <div className="action-items-tab__empty">
          <div className="action-items-tab__empty-icon">M</div>
          <div className="action-items-tab__empty-text">No manual items</div>
          <div className="action-items-tab__empty-subtext">
            Create your first manual action item to track tasks, follow-ups, decisions, or reminders
          </div>
        </div>
      )}

      {activeItems.length > 0 &&
        (Object.keys(CATEGORY_LABELS) as ManualActionItem['category'][]).map((category) => {
          const categoryItems = groupedActiveItems[category] || [];
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
                    onEditManualItem={onEditItem}
                    onDeleteManualItem={onDeleteItem}
                    onCompleteManualItem={onCompleteItem}
                    onUncompleteManualItem={onUncompleteItem}
                  />
                ))}
              </div>
            </div>
          );
        })}

      {completedItems.length > 0 && (
        <div className="action-items-tab__section action-items-tab__section--completed">
          <h3 className="action-items-tab__section-title">
            Completed
            <span className="action-items-tab__section-count action-items-tab__section-count--completed">
              {completedItems.length}
            </span>
          </h3>
          <div className="action-items-tab__list">
            {completedItems.map((item) => (
              <ActionItemCard
                key={item.id}
                item={item}
                onEditManualItem={onEditItem}
                onDeleteManualItem={onDeleteItem}
                onCompleteManualItem={onCompleteItem}
                onUncompleteManualItem={onUncompleteItem}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
