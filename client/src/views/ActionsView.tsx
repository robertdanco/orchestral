import type { ActionRequiredResult, ActionRequiredItem, JiraItem } from '../types';
import './ActionsView.css';

interface ActionsViewProps {
  actions: ActionRequiredResult;
  onSelectIssue: (item: JiraItem) => void;
}

interface ActionSectionProps {
  title: string;
  items: ActionRequiredItem[];
  onSelectIssue: (item: JiraItem) => void;
}

function ActionSection({ title, items, onSelectIssue }: ActionSectionProps) {
  const isEmpty = items.length === 0;

  return (
    <div className={`action-section ${isEmpty ? 'action-section--empty' : ''}`}>
      <h3 className="action-section__title">
        {title}
        <span className={`action-section__count ${isEmpty ? 'action-section__count--zero' : ''}`}>
          {items.length}
        </span>
      </h3>
      {isEmpty ? (
        <div className="action-section__empty">None</div>
      ) : (
        <ul className="action-section__list">
          {items.map(({ item, reason }) => (
            <li key={item.key} className="action-item">
              <span
                className="action-item__key"
                onClick={() => onSelectIssue(item)}
              >
                {item.key}
              </span>
              <span className="action-item__summary">{item.summary}</span>
              <span className="action-item__reason">{reason}</span>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="action-item__link"
              >
                Fix in Jira →
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ActionsView({ actions, onSelectIssue }: ActionsViewProps) {
  return (
    <div className="actions-view">
      <ActionSection
        title="Blockers"
        items={actions.blockers}
        onSelectIssue={onSelectIssue}
      />
      <ActionSection
        title="Blocked"
        items={actions.blocked}
        onSelectIssue={onSelectIssue}
      />
      <ActionSection
        title="Stale"
        items={actions.stale}
        onSelectIssue={onSelectIssue}
      />
      <ActionSection
        title="Missing Details"
        items={actions.missingDetails}
        onSelectIssue={onSelectIssue}
      />
      <ActionSection
        title="Unassigned"
        items={actions.unassigned}
        onSelectIssue={onSelectIssue}
      />
      <ActionSection
        title="Unestimated"
        items={actions.unestimated}
        onSelectIssue={onSelectIssue}
      />
    </div>
  );
}
