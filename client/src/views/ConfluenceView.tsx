import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type {
  ConfluenceSpaceWithPages,
  HierarchicalConfluencePage,
  ConfluencePage,
} from '../types';
import './ConfluenceView.css';

interface ConfluenceViewProps {
  spaces: ConfluenceSpaceWithPages[];
  loading: boolean;
}

interface PageNodeProps {
  page: HierarchicalConfluencePage;
  level: number;
  selectedPageId: string | null;
  onSelectPage: (page: HierarchicalConfluencePage) => void;
}

function PageNode({
  page,
  level,
  selectedPageId,
  onSelectPage,
}: PageNodeProps): JSX.Element {
  const [expanded, setExpanded] = useState(level < 1);
  const hasChildren = page.children.length > 0;
  const isSelected = selectedPageId === page.id;

  return (
    <div className="confluence-page" style={{ marginLeft: level * 16 }}>
      <div
        className={`confluence-page__row ${isSelected ? 'confluence-page__row--selected' : ''}`}
        onClick={() => onSelectPage(page)}
      >
        {hasChildren ? (
          <button
            className="confluence-page__toggle"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? '▼' : '▶'}
          </button>
        ) : (
          <span className="confluence-page__spacer" />
        )}
        <span className="confluence-page__icon">📄</span>
        <button className="confluence-page__title">{page.title}</button>
      </div>
      {expanded && hasChildren && (
        <div className="confluence-page__children">
          {page.children.map((child) => (
            <PageNode
              key={child.id}
              page={child}
              level={level + 1}
              selectedPageId={selectedPageId}
              onSelectPage={onSelectPage}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SpaceNodeProps {
  spaceWithPages: ConfluenceSpaceWithPages;
  selectedPageId: string | null;
  onSelectPage: (page: HierarchicalConfluencePage) => void;
}

function SpaceNode({
  spaceWithPages,
  selectedPageId,
  onSelectPage,
}: SpaceNodeProps): JSX.Element {
  const [expanded, setExpanded] = useState(true);
  const { space, pages } = spaceWithPages;
  const pageCount = countPages(pages);

  return (
    <div className="confluence-space">
      <button
        className="confluence-space__header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="confluence-space__toggle">
          {expanded ? '▼' : '▶'}
        </span>
        <span className="confluence-space__icon">{space.key.charAt(0)}</span>
        <span className="confluence-space__name">{space.name}</span>
        <span className="confluence-space__count">{pageCount} pages</span>
      </button>
      {expanded && pages.length > 0 && (
        <div className="confluence-space__pages">
          {pages.map((page) => (
            <PageNode
              key={page.id}
              page={page}
              level={0}
              selectedPageId={selectedPageId}
              onSelectPage={onSelectPage}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function countPages(pages: HierarchicalConfluencePage[]): number {
  let count = pages.length;
  for (const page of pages) {
    count += countPages(page.children);
  }
  return count;
}

interface PreviewPanelProps {
  page: ConfluencePage | null;
  loading: boolean;
}

function PreviewPanel({ page, loading }: PreviewPanelProps): JSX.Element {
  if (!page) {
    return (
      <div className="confluence-preview">
        <div className="confluence-preview__empty">
          Select a page to preview
        </div>
      </div>
    );
  }

  return (
    <div className="confluence-preview">
      <div className="confluence-preview__header">
        <span className="confluence-preview__title">{page.title}</span>
        <a
          href={page.url}
          target="_blank"
          rel="noopener noreferrer"
          className="confluence-preview__link"
        >
          Open in Confluence
        </a>
      </div>
      <div className="confluence-preview__content">
        <div className="confluence-preview__meta">
          <div className="confluence-preview__meta-item">
            <span className="confluence-preview__meta-label">Space:</span>
            <span className="confluence-preview__meta-value">
              {page.spaceKey}
            </span>
          </div>
          <div className="confluence-preview__meta-item">
            <span className="confluence-preview__meta-label">Updated:</span>
            <span className="confluence-preview__meta-value">
              {new Date(page.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        {loading ? (
          <div className="confluence-preview__body">Loading content...</div>
        ) : (
          <div className="confluence-preview__body">
            {page.body || 'No content preview available'}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfluenceView({
  spaces,
  loading,
}: ConfluenceViewProps): JSX.Element {
  const [selectedPage, setSelectedPage] = useState<ConfluencePage | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const handleSelectPage = useCallback(
    async (page: HierarchicalConfluencePage) => {
      setSelectedPage(page);
      setPreviewLoading(true);

      try {
        // Fetch full page content
        const fullPage = await api.getConfluencePage(page.id);
        setSelectedPage(fullPage);
      } catch {
        // Keep the basic page info if fetch fails
      } finally {
        setPreviewLoading(false);
      }
    },
    []
  );

  // Clear selection when spaces change
  useEffect(() => {
    setSelectedPage(null);
  }, [spaces]);

  if (loading && spaces.length === 0) {
    return <div className="confluence-loading">Loading documentation...</div>;
  }

  if (spaces.length === 0) {
    return (
      <div className="confluence-empty">
        No Confluence spaces found. Check your configuration.
      </div>
    );
  }

  return (
    <div className="confluence-view">
      <div className="confluence-tree">
        {spaces.map((spaceWithPages) => (
          <SpaceNode
            key={spaceWithPages.space.id}
            spaceWithPages={spaceWithPages}
            selectedPageId={selectedPage?.id || null}
            onSelectPage={handleSelectPage}
          />
        ))}
      </div>
      <PreviewPanel page={selectedPage} loading={previewLoading} />
    </div>
  );
}
