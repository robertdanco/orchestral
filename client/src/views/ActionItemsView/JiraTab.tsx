import type { JiraActionItem } from '../../types';
import { ActionItemsTab } from './ActionItemsTab';
import { JIRA_CATEGORY_LABELS, JIRA_EMPTY_STATE } from './utils';

interface JiraTabProps {
  items: JiraActionItem[];
  error?: string;
  onSelectIssue: (issueKey: string) => void;
}

export function JiraTab({ items, error, onSelectIssue }: JiraTabProps): JSX.Element {
  return (
    <ActionItemsTab
      items={items}
      error={error}
      categoryLabels={JIRA_CATEGORY_LABELS}
      emptyState={JIRA_EMPTY_STATE}
      errorPrefix="Error loading Jira items"
      onSelectJiraIssue={onSelectIssue}
    />
  );
}
