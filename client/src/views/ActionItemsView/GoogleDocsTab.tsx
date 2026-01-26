import type { GoogleDocsActionItem } from '../../types';
import { ActionItemsTab } from './ActionItemsTab';
import { GOOGLE_DOCS_CATEGORY_LABELS, GOOGLE_DOCS_EMPTY_STATE } from './utils';

interface GoogleDocsTabProps {
  items: GoogleDocsActionItem[];
  error?: string;
}

export function GoogleDocsTab({ items, error }: GoogleDocsTabProps): JSX.Element {
  return (
    <ActionItemsTab
      items={items}
      error={error}
      categoryLabels={GOOGLE_DOCS_CATEGORY_LABELS}
      emptyState={GOOGLE_DOCS_EMPTY_STATE}
      errorPrefix="Error loading Google Docs items"
    />
  );
}
