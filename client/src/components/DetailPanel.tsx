import type { JiraItem } from '../types';
import './DetailPanel.css';

interface DetailPanelProps {
  item: JiraItem | null;
  onClose: () => void;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function DetailPanel({ item, onClose }: DetailPanelProps) {
  if (!item) return null;

  return (
    <div className="detail-panel">
      <div className="detail-panel__header">
        <div className="detail-panel__title-row">
          <span className={`detail-panel__type detail-panel__type--${item.type}`}>
            {item.type}
          </span>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="detail-panel__key"
          >
            {item.key}
          </a>
          <button className="detail-panel__close" onClick={onClose}>
            ×
          </button>
        </div>
        <h2 className="detail-panel__summary">{item.summary}</h2>
        <span className={`detail-panel__status detail-panel__status--${item.statusCategory}`}>
          {item.status}
        </span>
      </div>

      <div className="detail-panel__body">
        <div className="detail-panel__section">
          <div className="detail-panel__field">
            <span className="detail-panel__label">Assignee</span>
            <span className="detail-panel__value">
              {item.assignee || 'Unassigned'}
            </span>
          </div>

          {item.parentKey && (
            <div className="detail-panel__field">
              <span className="detail-panel__label">Parent</span>
              <span className="detail-panel__value">{item.parentKey}</span>
            </div>
          )}

          {item.estimate && (
            <div className="detail-panel__field">
              <span className="detail-panel__label">Estimate</span>
              <span className="detail-panel__value">{item.estimate} points</span>
            </div>
          )}

          <div className="detail-panel__field">
            <span className="detail-panel__label">Created</span>
            <span className="detail-panel__value">{formatDate(item.created)}</span>
          </div>

          <div className="detail-panel__field">
            <span className="detail-panel__label">Updated</span>
            <span className="detail-panel__value">{formatDate(item.updated)}</span>
          </div>

          {item.labels.length > 0 && (
            <div className="detail-panel__field">
              <span className="detail-panel__label">Labels</span>
              <div className="detail-panel__labels">
                {item.labels.map(label => (
                  <span key={label} className="detail-panel__label-tag">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.blocked && (
            <div className="detail-panel__blocked">
              <strong>Blocked:</strong> {item.blockedReason || 'No reason provided'}
            </div>
          )}
        </div>

        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="detail-panel__jira-link"
        >
          Open in Jira
        </a>
      </div>
    </div>
  );
}
