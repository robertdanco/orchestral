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

interface SectionConfig {
  key: keyof ActionRequiredResult;
  title: string;
}

const SECTIONS: SectionConfig[] = [
  { key: 'blockers', title: 'Blockers' },
  { key: 'blocked', title: 'Blocked' },
  { key: 'stale', title: 'Stale' },
  { key: 'missingDetails', title: 'Missing Details' },
  { key: 'unassigned', title: 'Unassigned' },
  { key: 'unestimated', title: 'Unestimated' },
];

function ActionSection({ title, items, onSelectIssue }: ActionSectionProps): JSX.Element {
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
              <button
                className="action-item__key"
                onClick={() => onSelectIssue(item)}
              >
                {item.key}
              </button>
              <span className="action-item__summary">{item.summary}</span>
              <span className="action-item__reason">{reason}</span>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="action-item__link"
              >
                Fix in Jira
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ActionsView({ actions, onSelectIssue }: ActionsViewProps): JSX.Element {
  return (
    <div className="actions-view">
      {SECTIONS.map(({ key, title }) => (
        <ActionSection
          key={key}
          title={title}
          items={actions[key]}
          onSelectIssue={onSelectIssue}
        />
      ))}
    </div>
  );
}
