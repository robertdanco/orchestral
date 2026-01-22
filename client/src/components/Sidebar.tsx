import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

interface NavItem {
  label: string;
  route: string;
}

interface Section {
  title: string;
  items: NavItem[];
}

const sections: Section[] = [
  {
    title: 'Task Management',
    items: [
      { label: 'Kanban', route: '/' },
      { label: 'Tree', route: '/tree' },
      { label: 'Action Required', route: '/actions' },
    ],
  },
  {
    title: 'AI Assistant',
    items: [
      { label: 'Chat', route: '/chat' },
    ],
  },
];

export function Sidebar(): JSX.Element {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['Task Management', 'AI Assistant'])
  );

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  return (
    <nav className="sidebar">
      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.title);
        return (
          <div key={section.title} className="sidebar__section">
            <button
              className="sidebar__section-header"
              onClick={() => toggleSection(section.title)}
              aria-expanded={isExpanded}
            >
              <span className="sidebar__section-arrow">
                {isExpanded ? '▼' : '▶'}
              </span>
              <span className="sidebar__section-title">{section.title}</span>
            </button>
            <div
              className={`sidebar__section-content ${
                isExpanded ? 'sidebar__section-content--expanded' : ''
              }`}
            >
              {section.items.map((item) => (
                <NavLink
                  key={item.route}
                  to={item.route}
                  className={({ isActive }) =>
                    `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
