import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TreeView } from './TreeView';
import type { HierarchicalJiraItem } from '../types';

describe('TreeView', () => {
  const makeItem = (
    key: string,
    type: string,
    children: HierarchicalJiraItem[] = []
  ): HierarchicalJiraItem => ({
    key,
    summary: `Issue ${key}`,
    type: type as any,
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
    url: `https://test.atlassian.net/browse/${key}`,
    children,
  });

  const mockHierarchy: HierarchicalJiraItem[] = [
    makeItem('PROJ-1', 'initiative', [
      makeItem('PROJ-10', 'epic', [
        makeItem('PROJ-100', 'story'),
      ]),
    ]),
  ];

  it('renders root items', () => {
    render(<TreeView hierarchy={mockHierarchy} onSelectIssue={() => {}} />);

    expect(screen.getByText('Issue PROJ-1')).toBeInTheDocument();
  });

  it('shows children at shallow levels (level < 2 starts expanded)', () => {
    render(<TreeView hierarchy={mockHierarchy} onSelectIssue={() => {}} />);

    // Level 0 and 1 start expanded, so children should be visible
    expect(screen.getByText('Issue PROJ-10')).toBeInTheDocument();
  });

  it('collapses and expands on toggle click', () => {
    render(<TreeView hierarchy={mockHierarchy} onSelectIssue={() => {}} />);

    // Initially expanded, children visible
    expect(screen.getByText('Issue PROJ-10')).toBeInTheDocument();

    // Click first toggle to collapse root
    const toggleButtons = screen.getAllByText('▼');
    fireEvent.click(toggleButtons[0]);

    // Children should be hidden
    expect(screen.queryByText('Issue PROJ-10')).not.toBeInTheDocument();

    // Click toggle to expand again
    fireEvent.click(screen.getByText('▶'));

    // Children visible again
    expect(screen.getByText('Issue PROJ-10')).toBeInTheDocument();
  });

  it('calls onSelectIssue when clicking issue key', () => {
    const onSelect = vi.fn();
    render(<TreeView hierarchy={mockHierarchy} onSelectIssue={onSelect} />);

    fireEvent.click(screen.getByText('PROJ-1'));

    expect(onSelect).toHaveBeenCalled();
  });
});
