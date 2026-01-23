import { useState, useCallback } from 'react';
import type { ActionItemsResponse, JiraItem, ManualActionItem, CreateManualActionItemInput, UpdateManualActionItemInput } from '../../types';
import { JiraTab } from './JiraTab';
import { ConfluenceTab } from './ConfluenceTab';
import { ManualTab } from './ManualTab';
import { ManualItemForm } from './ManualItemForm';
import './ActionItemsView.css';

type TabId = 'all' | 'jira' | 'confluence' | 'manual';

interface ActionItemsViewProps {
  actionItems: ActionItemsResponse | null;
  loading: boolean;
  onRefresh: () => Promise<void>;
  onSelectIssue: (item: JiraItem) => void;
  getIssue: (key: string) => JiraItem | undefined;
  // Manual item operations
  onCreateManualItem: (input: CreateManualActionItemInput) => Promise<ManualActionItem>;
  onUpdateManualItem: (id: string, input: UpdateManualActionItemInput) => Promise<ManualActionItem>;
  onDeleteManualItem: (id: string) => Promise<void>;
  onCompleteManualItem: (id: string) => Promise<ManualActionItem>;
  onUncompleteManualItem: (id: string) => Promise<ManualActionItem>;
}

export function ActionItemsView({
  actionItems,
  loading,
  onRefresh,
  onSelectIssue,
  getIssue,
  onCreateManualItem,
  onUpdateManualItem,
  onDeleteManualItem,
  onCompleteManualItem,
  onUncompleteManualItem,
}: ActionItemsViewProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ManualActionItem | null>(null);

  const handleSelectJiraIssue = useCallback((issueKey: string) => {
    const issue = getIssue(issueKey);
    if (issue) {
      onSelectIssue(issue);
    }
  }, [getIssue, onSelectIssue]);


  const handleAddNewManualItem = useCallback(() => {
    setEditingItem(null);
    setShowForm(true);
  }, []);

  const handleEditManualItem = useCallback((item: ManualActionItem) => {
    setEditingItem(item);
    setShowForm(true);
  }, []);

  const handleFormSubmit = useCallback(async (input: CreateManualActionItemInput | UpdateManualActionItemInput) => {
    if (editingItem) {
      await onUpdateManualItem(editingItem.id, input);
    } else {
      await onCreateManualItem(input as CreateManualActionItemInput);
    }
    setShowForm(false);
    setEditingItem(null);
  }, [editingItem, onCreateManualItem, onUpdateManualItem]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingItem(null);
  }, []);

  const handleDeleteManualItem = useCallback(async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await onDeleteManualItem(id);
    }
  }, [onDeleteManualItem]);

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
  const manualItems = actionItems?.manual.items || [];
  const jiraError = actionItems?.jira.error;
  const confluenceError = actionItems?.confluence.error;
  const manualError = actionItems?.manual.error;
  const totalCount = actionItems?.totalCount || 0;

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: totalCount },
    { id: 'jira', label: 'Jira', count: jiraItems.length },
    { id: 'confluence', label: 'Confluence', count: confluenceItems.length },
    { id: 'manual', label: 'Manual', count: manualItems.length },
  ];

  return (
    <div className="action-items-view">
      <div className="action-items-view__header">
        <h1 className="action-items-view__title">Action Items</h1>
        <div className="action-items-view__header-actions">
          <button
            className="action-items-view__add-btn"
            onClick={handleAddNewManualItem}
          >
            + New Item
          </button>
          <button
            className="action-items-view__refresh"
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
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
          {manualItems.length > 0 && (
            <div className="action-items-view__section">
              <h2 className="action-items-view__section-title">Manual</h2>
              <ManualTab
                items={manualItems}
                error={manualError}
                onAddNew={handleAddNewManualItem}
                onEditItem={handleEditManualItem}
                onDeleteItem={handleDeleteManualItem}
                onCompleteItem={onCompleteManualItem}
                onUncompleteItem={onUncompleteManualItem}
              />
            </div>
          )}
          {totalCount === 0 && !jiraError && !confluenceError && !manualError && (
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

      {activeTab === 'manual' && (
        <ManualTab
          items={manualItems}
          error={manualError}
          onAddNew={handleAddNewManualItem}
          onEditItem={handleEditManualItem}
          onDeleteItem={handleDeleteManualItem}
          onCompleteItem={onCompleteManualItem}
          onUncompleteItem={onUncompleteManualItem}
        />
      )}

      {showForm && (
        <ManualItemForm
          item={editingItem}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
}
