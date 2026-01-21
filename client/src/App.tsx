import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Header } from './components/Header';
import { DetailPanel } from './components/DetailPanel';
import { KanbanView } from './views/KanbanView';
import { TreeView } from './views/TreeView';
import { ActionsView } from './views/ActionsView';
import { useIssues } from './hooks/useIssues';
import { useHierarchy } from './hooks/useHierarchy';
import { useActions } from './hooks/useActions';
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

  const loading = issuesLoading || hierarchyLoading || actionsLoading;

  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshIssues(), refreshHierarchy(), refreshActions()]);
  }, [refreshIssues, refreshHierarchy, refreshActions]);

  const handleSelectIssue = useCallback((item: JiraItem) => {
    setSelectedItem(item);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedItem(null);
  }, []);

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
      <nav className="nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} end>
          Kanban
        </NavLink>
        <NavLink to="/tree" className={({ isActive }) => isActive ? 'active' : ''}>
          Tree
        </NavLink>
        <NavLink to="/actions" className={({ isActive }) => isActive ? 'active' : ''}>
          Action Required
        </NavLink>
      </nav>
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
        </Routes>
      </main>
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
