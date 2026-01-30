import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActionsView } from './ActionsView';
import type { ActionRequiredResult, JiraItem } from '../types';

describe('ActionsView', () => {
  const mockItem: JiraItem = {
    key: 'PROJ-1',
    summary: 'Test issue',
    type: 'story',
    status: 'In Progress',
    statusCategory: 'inprogress',
    displayStatus: 'in-progress',
    assignee: null,
    parentKey: null,
    estimate: null,
    created: '2024-01-01T00:00:00Z',
    updated: '2024-01-01T00:00:00Z',
    labels: [],
    blocked: false,
    blockedReason: null,
    url: 'https://test.atlassian.net/browse/PROJ-1',
  };

  const mockActions: ActionRequiredResult = {
    blockers: [{ item: { ...mockItem, key: 'PROJ-4' }, reason: 'Blocks PROJ-1' }],
    blocked: [{ item: { ...mockItem, key: 'PROJ-1' }, reason: 'Blocked by API' }],
    stale: [{ item: { ...mockItem, key: 'PROJ-2' }, reason: 'No updates for 10 days' }],
    missingDetails: [],
    unassigned: [{ item: { ...mockItem, key: 'PROJ-3' }, reason: 'No assignee' }],
    unestimated: [],
  };

  it('renders all section headers', () => {
    render(<ActionsView actions={mockActions} onSelectIssue={() => {}} />);

    expect(screen.getByText('Blockers')).toBeInTheDocument();
    expect(screen.getByText('Blocked')).toBeInTheDocument();
    expect(screen.getByText('Stale')).toBeInTheDocument();
    expect(screen.getByText('Missing Details')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getByText('Unestimated')).toBeInTheDocument();
  });

  it('shows items with reasons', () => {
    render(<ActionsView actions={mockActions} onSelectIssue={() => {}} />);

    expect(screen.getByText('Blocked by API')).toBeInTheDocument();
    expect(screen.getByText('No updates for 10 days')).toBeInTheDocument();
  });

  it('shows empty state for sections with no items', () => {
    const emptyActions: ActionRequiredResult = {
      blockers: [],
      blocked: [],
      stale: [],
      missingDetails: [],
      unassigned: [],
      unestimated: [],
    };

    render(<ActionsView actions={emptyActions} onSelectIssue={() => {}} />);

    // All sections should still be visible with "None" text
    expect(screen.getByText('Blockers')).toBeInTheDocument();
    expect(screen.getAllByText('None')).toHaveLength(6);
  });
});
