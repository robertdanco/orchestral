import type { SlackActionItem } from '../../types';
import { ActionItemsTab } from './ActionItemsTab';
import { SLACK_CATEGORY_LABELS, SLACK_EMPTY_STATE } from './utils';

interface SlackTabProps {
  items: SlackActionItem[];
  error?: string;
}

export function SlackTab({ items, error }: SlackTabProps): JSX.Element {
  return (
    <ActionItemsTab
      items={items}
      error={error}
      categoryLabels={SLACK_CATEGORY_LABELS}
      emptyState={SLACK_EMPTY_STATE}
      errorPrefix="Error loading Slack items"
    />
  );
}
