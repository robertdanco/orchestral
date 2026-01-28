import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DetailPanel } from './components/DetailPanel';
import { KanbanView } from './views/KanbanView';
import { TreeView } from './views/TreeView';
import { ActionsView } from './views/ActionsView';
import { ChatView } from './views/ChatView';
import { ConfluenceView } from './views/ConfluenceView';
import { ActionItemsView } from './views/ActionItemsView';
import { OnboardingView } from './views/OnboardingView';
import { useIssues } from './hooks/useIssues';
import { useHierarchy } from './hooks/useHierarchy';
import { useActions } from './hooks/useActions';
import { useConfluence } from './hooks/useConfluence';
import { useActionItems } from './hooks/useActionItems';
import { useOnboarding } from './hooks/useOnboarding';
import type { JiraItem } from './types';
import './index.css';

function OnboardingRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isComplete, isInitialLoad } = useOnboarding();

  useEffect(() => {
    // Don't redirect while still loading status
    if (isInitialLoad) return;

    // Don't redirect if already on onboarding page
    if (location.pathname === '/onboarding') return;

    // Redirect to onboarding if not complete
    if (!isComplete) {
      navigate('/onboarding');
    }
  }, [isComplete, isInitialLoad, location.pathname, navigate]);

  return null;
}

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
    createManualItem,
    updateManualItem,
    deleteManualItem,
    completeManualItem,
    uncompleteManualItem,
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
              index
              element={
                <KanbanView issues={issues} onSelectIssue={handleSelectIssue} />
              }
            />
            <Route
              path="tree"
              element={
                <TreeView hierarchy={hierarchy} onSelectIssue={handleSelectIssue} />
              }
            />
            <Route
              path="actions"
              element={
                actions ? (
                  <ActionsView actions={actions} onSelectIssue={handleSelectIssue} />
                ) : (
                  <div>Loading...</div>
                )
              }
            />
            <Route
              path="confluence"
              element={
                <ConfluenceView
                  spaces={confluenceSpaces}
                  loading={confluenceLoading}
                />
              }
            />
            <Route
              path="chat"
              element={<ChatView onSelectIssue={handleSelectIssue} />}
            />
            <Route
              path="action-items"
              element={
                <ActionItemsView
                  actionItems={actionItems}
                  loading={actionItemsLoading}
                  onRefresh={refreshActionItems}
                  onSelectIssue={handleSelectIssue}
                  getIssue={getIssueByKey}
                  onCreateManualItem={createManualItem}
                  onUpdateManualItem={updateManualItem}
                  onDeleteManualItem={deleteManualItem}
                  onCompleteManualItem={completeManualItem}
                  onUncompleteManualItem={uncompleteManualItem}
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
      <OnboardingRedirect />
      <Routes>
        <Route path="/onboarding" element={<OnboardingView />} />
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
