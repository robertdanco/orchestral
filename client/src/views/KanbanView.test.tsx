import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KanbanView } from './KanbanView';
import type { JiraItem } from '../types';

describe('KanbanView', () => {
  const mockIssues: JiraItem[] = [
    {
      key: 'PROJ-1',
      summary: 'Todo item',
      type: 'story',
      status: 'To Do',
      statusCategory: 'todo',
      assignee: null,
      parentKey: null,
      estimate: null,
      created: '2024-01-01T00:00:00Z',
      updated: '2024-01-01T00:00:00Z',
      labels: [],
      blocked: false,
      blockedReason: null,
      url: 'https://test.atlassian.net/browse/PROJ-1',
    },
    {
      key: 'PROJ-2',
      summary: 'In progress item',
      type: 'task',
      status: 'In Progress',
      statusCategory: 'inprogress',
      assignee: 'John',
      parentKey: null,
      estimate: null,
      created: '2024-01-01T00:00:00Z',
      updated: '2024-01-01T00:00:00Z',
      labels: [],
      blocked: false,
      blockedReason: null,
      url: 'https://test.atlassian.net/browse/PROJ-2',
    },
  ];

  it('renders three columns', () => {
    render(<KanbanView issues={mockIssues} onSelectIssue={() => {}} />);

    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('places issues in correct columns', () => {
    render(<KanbanView issues={mockIssues} onSelectIssue={() => {}} />);

    expect(screen.getByText('Todo item')).toBeInTheDocument();
    expect(screen.getByText('In progress item')).toBeInTheDocument();
  });

  it('shows empty state for columns with no issues', () => {
    render(<KanbanView issues={[]} onSelectIssue={() => {}} />);

    expect(screen.getAllByText('No items')).toHaveLength(3);
  });
});
