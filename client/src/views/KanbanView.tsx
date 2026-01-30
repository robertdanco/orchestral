import { useMemo } from 'react';
import { IssueCard } from '../components/IssueCard';
import type { JiraItem, DisplayStatus, StatusGroup } from '../types';
import {
  DISPLAY_STATUS_COLUMNS,
  DISPLAY_STATUS_LABELS,
  STATUS_GROUP_MAP,
  STATUS_GROUP_LABELS,
} from '../types';
import './KanbanView.css';

interface KanbanViewProps {
  issues: JiraItem[];
  onSelectIssue: (item: JiraItem) => void;
}

const STATUS_GROUPS: StatusGroup[] = ['unstarted', 'active', 'completed'];

function getColumnsForGroup(group: StatusGroup): DisplayStatus[] {
  return DISPLAY_STATUS_COLUMNS.filter(
    (status) => STATUS_GROUP_MAP[status] === group
  );
}

export function KanbanView({ issues, onSelectIssue }: KanbanViewProps): JSX.Element {
  const columns = useMemo(() => {
    const grouped: Record<DisplayStatus, JiraItem[]> = {
      backlog: [],
      triage: [],
      'in-progress': [],
      'code-review': [],
      'design-review': [],
      'in-qa': [],
      done: [],
      abandoned: [],
    };

    for (const issue of issues) {
      // Skip abandoned items from display
      if (issue.displayStatus === 'abandoned') continue;
      grouped[issue.displayStatus].push(issue);
    }

    return grouped;
  }, [issues]);

  return (
    <div className="kanban">
      {STATUS_GROUPS.map((group) => (
        <div key={group} className={`kanban__group kanban__group--${group}`}>
          <div className="kanban__group-header">
            {STATUS_GROUP_LABELS[group]}
          </div>
          <div className="kanban__group-columns">
            {getColumnsForGroup(group).map((status) => (
              <div key={status} className="kanban__column">
                <div className="kanban__column-header">
                  <span className="kanban__column-title">
                    {DISPLAY_STATUS_LABELS[status]}
                  </span>
                  <span className="kanban__column-count">
                    {columns[status].length}
                  </span>
                </div>
                <div className="kanban__column-content">
                  {columns[status].length === 0 ? (
                    <div className="kanban__empty">No items</div>
                  ) : (
                    columns[status].map((issue) => (
                      <IssueCard
                        key={issue.key}
                        item={issue}
                        onClick={onSelectIssue}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
