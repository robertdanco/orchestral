import { describe, it, expect, vi } from 'vitest';
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
    blocked: [{ item: { ...mockItem, key: 'PROJ-1' }, reason: 'Blocked by API' }],
    stale: [{ item: { ...mockItem, key: 'PROJ-2' }, reason: 'No updates for 10 days' }],
    missingDetails: [],
    unassigned: [{ item: { ...mockItem, key: 'PROJ-3' }, reason: 'No assignee' }],
    unestimated: [],
  };

  it('renders section headers', () => {
    render(<ActionsView actions={mockActions} onSelectIssue={() => {}} />);

    expect(screen.getByText('Blocked')).toBeInTheDocument();
    expect(screen.getByText('Stale')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('shows items with reasons', () => {
    render(<ActionsView actions={mockActions} onSelectIssue={() => {}} />);

    expect(screen.getByText('Blocked by API')).toBeInTheDocument();
    expect(screen.getByText('No updates for 10 days')).toBeInTheDocument();
  });

  it('shows all clear message when no actions', () => {
    const emptyActions: ActionRequiredResult = {
      blocked: [],
      stale: [],
      missingDetails: [],
      unassigned: [],
      unestimated: [],
    };

    render(<ActionsView actions={emptyActions} onSelectIssue={() => {}} />);

    expect(screen.getByText('All clear!')).toBeInTheDocument();
  });
});
