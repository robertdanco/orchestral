import type { ConfluenceActionItem } from '../../types';
import { ActionItemsTab } from './ActionItemsTab';
import { CONFLUENCE_CATEGORY_LABELS, CONFLUENCE_EMPTY_STATE } from './utils';

interface ConfluenceTabProps {
  items: ConfluenceActionItem[];
  error?: string;
}

export function ConfluenceTab({ items, error }: ConfluenceTabProps): JSX.Element {
  return (
    <ActionItemsTab
      items={items}
      error={error}
      categoryLabels={CONFLUENCE_CATEGORY_LABELS}
      emptyState={CONFLUENCE_EMPTY_STATE}
      errorPrefix="Error loading Confluence items"
    />
  );
}
