import { useState, useCallback } from 'react';
import type { ActionItemsResponse, JiraItem } from '../../types';
import { JiraTab } from './JiraTab';
import { ConfluenceTab } from './ConfluenceTab';
import './ActionItemsView.css';

type TabId = 'all' | 'jira' | 'confluence';

interface ActionItemsViewProps {
  actionItems: ActionItemsResponse | null;
  loading: boolean;
  onRefresh: () => Promise<void>;
  onSelectIssue: (item: JiraItem) => void;
  getIssue: (key: string) => JiraItem | undefined;
}

export function ActionItemsView({
  actionItems,
  loading,
  onRefresh,
  onSelectIssue,
  getIssue,
}: ActionItemsViewProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabId>('all');

  const handleSelectJiraIssue = useCallback((issueKey: string) => {
    const issue = getIssue(issueKey);
    if (issue) {
      onSelectIssue(issue);
    }
  }, [getIssue, onSelectIssue]);

  const handleRefresh = useCallback(async () => {
    await onRefresh();
  }, [onRefresh]);

  if (loading && !actionItems) {
    return (
      <div className="action-items-view">
        <div className="action-items-view__loading">
          <div className="action-items-view__loading-spinner" />
        </div>
      </div>
    );
  }

  const jiraItems = actionItems?.jira.items || [];
  const confluenceItems = actionItems?.confluence.items || [];
  const jiraError = actionItems?.jira.error;
  const confluenceError = actionItems?.confluence.error;
  const totalCount = actionItems?.totalCount || 0;

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: totalCount },
    { id: 'jira', label: 'Jira', count: jiraItems.length },
    { id: 'confluence', label: 'Confluence', count: confluenceItems.length },
  ];

  return (
    <div className="action-items-view">
      <div className="action-items-view__header">
        <h1 className="action-items-view__title">Action Items</h1>
        <button
          className="action-items-view__refresh"
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="action-items-view__tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`action-items-view__tab ${
              activeTab === tab.id ? 'action-items-view__tab--active' : ''
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.label}</span>
            <span
              className={`action-items-view__tab-badge ${
                tab.count === 0 ? 'action-items-view__tab-badge--zero' : ''
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {activeTab === 'all' && (
        <div className="action-items-view__all">
          {jiraItems.length > 0 && (
            <div className="action-items-view__section">
              <h2 className="action-items-view__section-title">Jira</h2>
              <JiraTab
                items={jiraItems}
                error={jiraError}
                onSelectIssue={handleSelectJiraIssue}
              />
            </div>
          )}
          {confluenceItems.length > 0 && (
            <div className="action-items-view__section">
              <h2 className="action-items-view__section-title">Confluence</h2>
              <ConfluenceTab items={confluenceItems} error={confluenceError} />
            </div>
          )}
          {totalCount === 0 && !jiraError && !confluenceError && (
            <div className="action-items-tab__empty">
              <div className="action-items-tab__empty-icon">*</div>
              <div className="action-items-tab__empty-text">All caught up!</div>
              <div className="action-items-tab__empty-subtext">
                No action items require your attention
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'jira' && (
        <JiraTab
          items={jiraItems}
          error={jiraError}
          onSelectIssue={handleSelectJiraIssue}
        />
      )}

      {activeTab === 'confluence' && (
        <ConfluenceTab items={confluenceItems} error={confluenceError} />
      )}
    </div>
  );
}
