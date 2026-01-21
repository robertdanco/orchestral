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
  if (items.length === 0) return null;

  return (
    <div className="action-section">
      <h3 className="action-section__title">
        {title}
        <span className="action-section__count">{items.length}</span>
      </h3>
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
    </div>
  );
}

export function ActionsView({ actions, onSelectIssue }: ActionsViewProps) {
  const totalCount =
    actions.blocked.length +
    actions.stale.length +
    actions.missingDetails.length +
    actions.unassigned.length +
    actions.unestimated.length;

  if (totalCount === 0) {
    return (
      <div className="actions-empty">
        <div className="actions-empty__icon">✓</div>
        <div className="actions-empty__text">All clear!</div>
        <div className="actions-empty__subtext">No items need attention</div>
      </div>
    );
  }

  return (
    <div className="actions-view">
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
