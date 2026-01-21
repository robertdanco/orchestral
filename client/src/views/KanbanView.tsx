import { useMemo } from 'react';
import { IssueCard } from '../components/IssueCard';
import type { JiraItem, StatusCategory } from '../types';
import './KanbanView.css';

interface KanbanViewProps {
  issues: JiraItem[];
  onSelectIssue: (item: JiraItem) => void;
}

const COLUMNS: { key: StatusCategory; label: string }[] = [
  { key: 'todo', label: 'To Do' },
  { key: 'inprogress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

export function KanbanView({ issues, onSelectIssue }: KanbanViewProps) {
  const columns = useMemo(() => {
    const grouped: Record<StatusCategory, JiraItem[]> = {
      todo: [],
      inprogress: [],
      done: [],
    };

    for (const issue of issues) {
      grouped[issue.statusCategory].push(issue);
    }

    return grouped;
  }, [issues]);

  return (
    <div className="kanban">
      {COLUMNS.map(({ key, label }) => (
        <div key={key} className="kanban__column">
          <div className="kanban__column-header">
            <span className="kanban__column-title">{label}</span>
            <span className="kanban__column-count">{columns[key].length}</span>
          </div>
          <div className="kanban__column-content">
            {columns[key].length === 0 ? (
              <div className="kanban__empty">No items</div>
            ) : (
              columns[key].map(issue => (
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
  );
}
