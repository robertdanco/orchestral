import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

interface NavItem {
  label: string;
  route: string;
  badge?: number;
}

interface Section {
  title: string;
  items: NavItem[];
  badge?: number;
}

interface SidebarProps {
  actionItemsCount?: number;
}

function getSections(actionItemsCount: number): Section[] {
  return [
    {
      title: 'Action Items',
      items: [
        { label: 'All Actions', route: '/action-items', badge: actionItemsCount },
      ],
      badge: actionItemsCount,
    },
    {
      title: 'Task Management',
      items: [
        { label: 'Kanban', route: '/' },
        { label: 'Tree', route: '/tree' },
        { label: 'Action Required', route: '/actions' },
      ],
    },
    {
      title: 'Documentation',
      items: [
        { label: 'Confluence', route: '/confluence' },
      ],
    },
    {
      title: 'AI Assistant',
      items: [
        { label: 'Chat', route: '/chat' },
      ],
    },
  ];
}

export function Sidebar({ actionItemsCount = 0 }: SidebarProps): JSX.Element {
  const sections = getSections(actionItemsCount);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['Action Items', 'Task Management', 'Documentation', 'AI Assistant'])
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
              {section.badge !== undefined && section.badge > 0 && (
                <span className="sidebar__section-badge">{section.badge}</span>
              )}
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
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="sidebar__item-badge">{item.badge}</span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
