import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KanbanView } from './KanbanView';
import type { JiraItem } from '../types';

describe('KanbanView', () => {
  const mockIssues: JiraItem[] = [
    {
      key: 'PROJ-1',
      summary: 'Backlog item',
      type: 'story',
      status: 'To Do',
      statusCategory: 'todo',
      displayStatus: 'backlog',
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
      displayStatus: 'in-progress',
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
    {
      key: 'PROJ-3',
      summary: 'Code review item',
      type: 'story',
      status: 'Code Review',
      statusCategory: 'inprogress',
      displayStatus: 'code-review',
      assignee: 'Jane',
      parentKey: null,
      estimate: null,
      created: '2024-01-01T00:00:00Z',
      updated: '2024-01-01T00:00:00Z',
      labels: [],
      blocked: false,
      blockedReason: null,
      url: 'https://test.atlassian.net/browse/PROJ-3',
    },
  ];

  it('renders group headers', () => {
    render(<KanbanView issues={mockIssues} onSelectIssue={() => {}} />);

    expect(screen.getByText('Not Started')).toBeInTheDocument();
    expect(screen.getByText('Active Work')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders seven columns', () => {
    render(<KanbanView issues={mockIssues} onSelectIssue={() => {}} />);

    expect(screen.getByText('Backlog')).toBeInTheDocument();
    expect(screen.getByText('Triage')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Code Review')).toBeInTheDocument();
    expect(screen.getByText('Design Review')).toBeInTheDocument();
    expect(screen.getByText('In QA')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('places issues in correct columns based on displayStatus', () => {
    render(<KanbanView issues={mockIssues} onSelectIssue={() => {}} />);

    expect(screen.getByText('Backlog item')).toBeInTheDocument();
    expect(screen.getByText('In progress item')).toBeInTheDocument();
    expect(screen.getByText('Code review item')).toBeInTheDocument();
  });

  it('shows empty state for columns with no issues', () => {
    render(<KanbanView issues={[]} onSelectIssue={() => {}} />);

    // 7 columns should all show "No items"
    expect(screen.getAllByText('No items')).toHaveLength(7);
  });

  it('filters out abandoned items', () => {
    const issuesWithAbandoned: JiraItem[] = [
      ...mockIssues,
      {
        key: 'PROJ-4',
        summary: 'Abandoned item',
        type: 'story',
        status: 'Abandoned',
        statusCategory: 'done',
        displayStatus: 'abandoned',
        assignee: null,
        parentKey: null,
        estimate: null,
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z',
        labels: [],
        blocked: false,
        blockedReason: null,
        url: 'https://test.atlassian.net/browse/PROJ-4',
      },
    ];

    render(<KanbanView issues={issuesWithAbandoned} onSelectIssue={() => {}} />);

    // Abandoned item should not appear
    expect(screen.queryByText('Abandoned item')).not.toBeInTheDocument();
  });
});
