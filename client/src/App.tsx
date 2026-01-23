import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DetailPanel } from './components/DetailPanel';
import { KanbanView } from './views/KanbanView';
import { TreeView } from './views/TreeView';
import { ActionsView } from './views/ActionsView';
import { ChatView } from './views/ChatView';
import { ConfluenceView } from './views/ConfluenceView';
import { ActionItemsView } from './views/ActionItemsView';
import { useIssues } from './hooks/useIssues';
import { useHierarchy } from './hooks/useHierarchy';
import { useActions } from './hooks/useActions';
import { useConfluence } from './hooks/useConfluence';
import { useActionItems } from './hooks/useActionItems';
import type { JiraItem } from './types';
import './index.css';

function AppContent() {
  const [selectedItem, setSelectedItem] = useState<JiraItem | null>(null);

  const {
    issues,
    loading: issuesLoading,
    error: issuesError,
    lastRefreshed,
    refresh: refreshIssues,
  } = useIssues();

  const {
    hierarchy,
    loading: hierarchyLoading,
    refresh: refreshHierarchy,
  } = useHierarchy();

  const {
    actions,
    loading: actionsLoading,
    refresh: refreshActions,
  } = useActions();

  const {
    spaces: confluenceSpaces,
    loading: confluenceLoading,
    refresh: refreshConfluence,
  } = useConfluence();

  const {
    actionItems,
    loading: actionItemsLoading,
    totalCount: actionItemsTotalCount,
    refresh: refreshActionItems,
  } = useActionItems();

  const loading = issuesLoading || hierarchyLoading || actionsLoading || confluenceLoading || actionItemsLoading;

  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshIssues(), refreshHierarchy(), refreshActions(), refreshConfluence(), refreshActionItems()]);
  }, [refreshIssues, refreshHierarchy, refreshActions, refreshConfluence, refreshActionItems]);

  const handleSelectIssue = useCallback((item: JiraItem) => {
    setSelectedItem(item);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const getIssueByKey = useCallback((key: string): JiraItem | undefined => {
    return issues.find(issue => issue.key === key);
  }, [issues]);

  if (issuesError) {
    return (
      <div className="error">
        <h2>Error loading data</h2>
        <p>{issuesError}</p>
        <button onClick={handleRefresh}>Retry</button>
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        lastRefreshed={lastRefreshed}
        loading={loading}
        onRefresh={handleRefresh}
      />
      <div className="app__body">
        <Sidebar actionItemsCount={actionItemsTotalCount} />
        <main className={`main ${selectedItem ? 'main--with-panel' : ''}`}>
          <Routes>
            <Route
              path="/"
              element={
                <KanbanView issues={issues} onSelectIssue={handleSelectIssue} />
              }
            />
            <Route
              path="/tree"
              element={
                <TreeView hierarchy={hierarchy} onSelectIssue={handleSelectIssue} />
              }
            />
            <Route
              path="/actions"
              element={
                actions ? (
                  <ActionsView actions={actions} onSelectIssue={handleSelectIssue} />
                ) : (
                  <div>Loading...</div>
                )
              }
            />
            <Route
              path="/confluence"
              element={
                <ConfluenceView
                  spaces={confluenceSpaces}
                  loading={confluenceLoading}
                />
              }
            />
            <Route
              path="/chat"
              element={<ChatView onSelectIssue={handleSelectIssue} />}
            />
            <Route
              path="/action-items"
              element={
                <ActionItemsView
                  actionItems={actionItems}
                  loading={actionItemsLoading}
                  onRefresh={refreshActionItems}
                  onSelectIssue={handleSelectIssue}
                  getIssue={getIssueByKey}
                />
              }
            />
          </Routes>
        </main>
      </div>
      <DetailPanel item={selectedItem} onClose={handleClosePanel} />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
