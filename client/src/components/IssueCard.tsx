import type { JiraItem } from '../types';
import './IssueCard.css';

interface IssueCardProps {
  item: JiraItem;
  onClick: (item: JiraItem) => void;
}

export function IssueCard({ item, onClick }: IssueCardProps): JSX.Element {
  return (
    <button
      className={`issue-card issue-card--${item.statusCategory}`}
      onClick={() => onClick(item)}
    >
      <div className="issue-card__header">
        <span className={`issue-card__type issue-card__type--${item.type}`}>
          {item.type}
        </span>
        <span className="issue-card__key">{item.key}</span>
        {item.blocked && <span className="issue-card__blocked">Blocked</span>}
      </div>
      <div className="issue-card__summary">{item.summary}</div>
      <div className="issue-card__footer">
        {item.assignee && (
          <span className="issue-card__assignee">{item.assignee}</span>
        )}
        {item.estimate && (
          <span className="issue-card__estimate">{item.estimate}pt</span>
        )}
      </div>
    </button>
  );
}
