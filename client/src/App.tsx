import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="nav">
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
            Kanban
          </NavLink>
          <NavLink to="/tree" className={({ isActive }) => isActive ? 'active' : ''}>
            Tree
          </NavLink>
          <NavLink to="/actions" className={({ isActive }) => isActive ? 'active' : ''}>
            Action Required
          </NavLink>
        </nav>
        <main className="main">
          <Routes>
            <Route path="/" element={<div>Kanban View (coming soon)</div>} />
            <Route path="/tree" element={<div>Tree View (coming soon)</div>} />
            <Route path="/actions" element={<div>Action Required (coming soon)</div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
