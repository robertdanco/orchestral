import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IssueCard } from './IssueCard';
import type { JiraItem } from '../types';

describe('IssueCard', () => {
  const mockItem: JiraItem = {
    key: 'PROJ-123',
    summary: 'Test issue summary',
    type: 'story',
    status: 'In Progress',
    statusCategory: 'inprogress',
    assignee: 'John Doe',
    parentKey: null,
    estimate: 5,
    created: '2024-01-01T00:00:00Z',
    updated: '2024-01-15T00:00:00Z',
    labels: ['frontend'],
    blocked: false,
    blockedReason: null,
    url: 'https://test.atlassian.net/browse/PROJ-123',
  };

  it('renders issue key and summary', () => {
    render(<IssueCard item={mockItem} onClick={() => {}} />);

    expect(screen.getByText('PROJ-123')).toBeInTheDocument();
    expect(screen.getByText('Test issue summary')).toBeInTheDocument();
  });

  it('shows assignee', () => {
    render(<IssueCard item={mockItem} onClick={() => {}} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('shows type badge', () => {
    render(<IssueCard item={mockItem} onClick={() => {}} />);

    expect(screen.getByText('story')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<IssueCard item={mockItem} onClick={onClick} />);

    fireEvent.click(screen.getByText('PROJ-123'));
    expect(onClick).toHaveBeenCalledWith(mockItem);
  });

  it('shows blocked indicator when blocked', () => {
    const blockedItem = { ...mockItem, blocked: true };
    render(<IssueCard item={blockedItem} onClick={() => {}} />);

    expect(screen.getByText('Blocked')).toBeInTheDocument();
  });
});
