import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DetailPanel } from './DetailPanel';
import type { JiraItem } from '../types';

describe('DetailPanel', () => {
  const mockItem: JiraItem = {
    key: 'PROJ-123',
    summary: 'Test issue with details',
    type: 'story',
    status: 'In Progress',
    statusCategory: 'inprogress',
    displayStatus: 'in-progress',
    assignee: 'John Doe',
    parentKey: 'PROJ-100',
    estimate: 5,
    created: '2024-01-01T00:00:00Z',
    updated: '2024-01-15T00:00:00Z',
    labels: ['frontend', 'urgent'],
    blocked: false,
    blockedReason: null,
    url: 'https://test.atlassian.net/browse/PROJ-123',
  };

  it('renders nothing when item is null', () => {
    const { container } = render(<DetailPanel item={null} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders issue details', () => {
    render(<DetailPanel item={mockItem} onClose={() => {}} />);

    expect(screen.getByText('PROJ-123')).toBeInTheDocument();
    expect(screen.getByText('Test issue with details')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('shows Open in Jira link', () => {
    render(<DetailPanel item={mockItem} onClose={() => {}} />);

    const link = screen.getByText('Open in Jira');
    expect(link).toHaveAttribute('href', mockItem.url);
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<DetailPanel item={mockItem} onClose={onClose} />);

    fireEvent.click(screen.getByText('×'));
    expect(onClose).toHaveBeenCalled();
  });
});
