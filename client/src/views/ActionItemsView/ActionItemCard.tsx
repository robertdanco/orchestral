import type { ActionItem, ManualActionItem } from '../../types';
import { MANUAL_CATEGORY_LABELS, SLACK_CATEGORY_LABELS, isJiraItem, isConfluenceItem, isManualItem, isSlackItem } from './utils';

interface ActionItemCardProps {
  item: ActionItem;
  onSelectJiraIssue?: (issueKey: string) => void;
  onEditManualItem?: (item: ManualActionItem) => void;
  onDeleteManualItem?: (id: string) => void;
  onCompleteManualItem?: (id: string) => void;
  onUncompleteManualItem?: (id: string) => void;
}

function getPriorityClass(priority: ActionItem['priority']): string {
  switch (priority) {
    case 'high':
      return 'action-item-card--priority-high';
    case 'medium':
      return 'action-item-card--priority-medium';
    case 'low':
      return 'action-item-card--priority-low';
    default:
      return '';
  }
}

export function ActionItemCard({
  item,
  onSelectJiraIssue,
  onEditManualItem,
  onDeleteManualItem,
  onCompleteManualItem,
  onUncompleteManualItem,
}: ActionItemCardProps): JSX.Element {
  const priorityClass = getPriorityClass(item.priority);

  if (isManualItem(item)) {
    const isCompleted = !!item.completedAt;
    const completedClass = isCompleted ? 'action-item-card--completed' : '';
    const categoryLabel = MANUAL_CATEGORY_LABELS[item.category];

    return (
      <div className={`action-item-card action-item-card--manual ${priorityClass} ${completedClass}`}>
        <div className="action-item-card__header">
          <span className="action-item-card__category-badge">{categoryLabel}</span>
          <span className="action-item-card__source">Manual</span>
        </div>
        <div className="action-item-card__title">{item.title}</div>
        {item.description && (
          <div className="action-item-card__description">{item.description}</div>
        )}
        {item.dueDate && (
          <div className="action-item-card__due-date">
            Due: {new Date(item.dueDate).toLocaleDateString()}
          </div>
        )}
        <div className="action-item-card__footer">
          <span className="action-item-card__reason">{item.reason}</span>
          <div className="action-item-card__actions">
            {isCompleted ? (
              <button
                className="action-item-card__action-btn action-item-card__action-btn--uncomplete"
                onClick={() => onUncompleteManualItem?.(item.id)}
                title="Mark as incomplete"
              >
                Undo
              </button>
            ) : (
              <button
                className="action-item-card__action-btn action-item-card__action-btn--complete"
                onClick={() => onCompleteManualItem?.(item.id)}
                title="Mark as complete"
              >
                Complete
              </button>
            )}
            <button
              className="action-item-card__action-btn action-item-card__action-btn--edit"
              onClick={() => onEditManualItem?.(item)}
              title="Edit item"
            >
              Edit
            </button>
            <button
              className="action-item-card__action-btn action-item-card__action-btn--delete"
              onClick={() => onDeleteManualItem?.(item.id)}
              title="Delete item"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isJiraItem(item)) {
    return (
      <div className={`action-item-card action-item-card--jira ${priorityClass}`}>
        <div className="action-item-card__header">
          <button
            className="action-item-card__key"
            onClick={() => onSelectJiraIssue?.(item.issueKey)}
          >
            {item.issueKey}
          </button>
          <span className="action-item-card__source">Jira</span>
        </div>
        <div className="action-item-card__title">{item.title}</div>
        <div className="action-item-card__footer">
          <span className="action-item-card__reason">{item.reason}</span>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="action-item-card__link"
          >
            Open in Jira
          </a>
        </div>
      </div>
    );
  }

  if (isConfluenceItem(item)) {
    return (
      <div className={`action-item-card action-item-card--confluence ${priorityClass}`}>
        <div className="action-item-card__header">
          <span className="action-item-card__page-title">{item.pageTitle}</span>
          <span className="action-item-card__source">Confluence</span>
        </div>
        <div className="action-item-card__title">{item.title}</div>
        <div className="action-item-card__author">by {item.authorName}</div>
        <div className="action-item-card__footer">
          <span className="action-item-card__reason">{item.reason}</span>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="action-item-card__link"
          >
            View Comment
          </a>
        </div>
      </div>
    );
  }

  if (isSlackItem(item)) {
    const categoryLabel = SLACK_CATEGORY_LABELS[item.category];
    return (
      <div className={`action-item-card action-item-card--slack ${priorityClass}`}>
        <div className="action-item-card__header">
          <span className="action-item-card__category-badge">{categoryLabel}</span>
          <span className="action-item-card__channel">#{item.channelName}</span>
          <span className="action-item-card__source">Slack</span>
        </div>
        <div className="action-item-card__title">{item.title}</div>
        <div className="action-item-card__author">by {item.authorName}</div>
        <div className="action-item-card__footer">
          <span className="action-item-card__reason">{item.reason}</span>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="action-item-card__link"
          >
            View in Slack
          </a>
        </div>
      </div>
    );
  }

  return <div>Unknown item type</div>;
}
