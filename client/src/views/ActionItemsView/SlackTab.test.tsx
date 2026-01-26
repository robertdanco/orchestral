import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SlackTab } from './SlackTab';
import type { SlackActionItem } from '../../types';

describe('SlackTab', () => {
  const mockMentionItem: SlackActionItem = {
    id: 'slack-C12345-1234567890.123456-mention',
    source: 'slack',
    title: 'Hey @user, can you review this?',
    reason: 'testuser mentioned you in #engineering',
    url: 'https://slack.com/archives/C12345/p1234567890123456',
    createdAt: '2024-01-15T10:30:00.000Z',
    priority: 'high',
    category: 'mention',
    channelId: 'C12345',
    channelName: 'engineering',
    messageTs: '1234567890.123456',
    threadTs: null,
    authorId: 'U12345',
    authorName: 'testuser',
  };

  const mockThreadReplyItem: SlackActionItem = {
    id: 'slack-C67890-1234567890.999999-thread-reply',
    source: 'slack',
    title: 'I fixed the bug you reported',
    reason: 'anotheruser replied to your thread in #bugs',
    url: 'https://slack.com/archives/C67890/p1234567890999999',
    createdAt: '2024-01-15T11:00:00.000Z',
    priority: 'medium',
    category: 'thread-reply',
    channelId: 'C67890',
    channelName: 'bugs',
    messageTs: '1234567890.999999',
    threadTs: '1234567890.000001',
    authorId: 'U67890',
    authorName: 'anotheruser',
  };

  it('renders empty state when no items', () => {
    render(<SlackTab items={[]} />);

    expect(screen.getByText('No Slack action items')).toBeInTheDocument();
    expect(screen.getByText('No mentions or thread replies require your attention')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(<SlackTab items={[]} error="Failed to connect to Slack" />);

    expect(screen.getByText(/Error loading Slack items:/)).toBeInTheDocument();
    expect(screen.getByText(/Failed to connect to Slack/)).toBeInTheDocument();
  });

  it('renders mention items grouped by category', () => {
    render(<SlackTab items={[mockMentionItem]} />);

    // Check for section title (h3 element)
    expect(screen.getByRole('heading', { name: /Mentions/ })).toBeInTheDocument();
    expect(screen.getByText('Hey @user, can you review this?')).toBeInTheDocument();
    expect(screen.getByText('testuser mentioned you in #engineering')).toBeInTheDocument();
  });

  it('renders thread reply items grouped by category', () => {
    render(<SlackTab items={[mockThreadReplyItem]} />);

    // Check for section title (h3 element)
    expect(screen.getByRole('heading', { name: /Thread Replies/ })).toBeInTheDocument();
    expect(screen.getByText('I fixed the bug you reported')).toBeInTheDocument();
    expect(screen.getByText('anotheruser replied to your thread in #bugs')).toBeInTheDocument();
  });

  it('renders both categories when items exist', () => {
    render(<SlackTab items={[mockMentionItem, mockThreadReplyItem]} />);

    // Use getAllByText since there will be multiple elements with these texts (headers and badges)
    expect(screen.getByRole('heading', { name: /Mentions/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Thread Replies/ })).toBeInTheDocument();
  });

  it('shows category count badges', () => {
    render(<SlackTab items={[mockMentionItem, { ...mockMentionItem, id: 'another' }]} />);

    // Should show count of 2 for mentions
    const countBadge = screen.getByText('2');
    expect(countBadge).toBeInTheDocument();
  });

  it('renders View in Slack link', () => {
    render(<SlackTab items={[mockMentionItem]} />);

    const link = screen.getByText('View in Slack');
    expect(link).toHaveAttribute('href', mockMentionItem.url);
    expect(link).toHaveAttribute('target', '_blank');
  });
});
