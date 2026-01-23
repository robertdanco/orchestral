import type { ActionItem, JiraActionItem, ConfluenceActionItem } from '../../types';

interface ActionItemCardProps {
  item: ActionItem;
  onSelectJiraIssue?: (issueKey: string) => void;
}

function isJiraItem(item: ActionItem): item is JiraActionItem {
  return item.source === 'jira';
}

function isConfluenceItem(item: ActionItem): item is ConfluenceActionItem {
  return item.source === 'confluence';
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

export function ActionItemCard({ item, onSelectJiraIssue }: ActionItemCardProps): JSX.Element {
  const priorityClass = getPriorityClass(item.priority);

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

  return <div>Unknown item type</div>;
}
