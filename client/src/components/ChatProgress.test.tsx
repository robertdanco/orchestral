import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatProgress } from './ChatProgress';
import type { ChatProgress as ChatProgressType } from '../types/chat';

describe('ChatProgress', () => {
  it('renders nothing when phase is idle', () => {
    const progress: ChatProgressType = {
      phase: 'idle',
      queriedSources: [],
      completedSources: [],
    };

    const { container } = render(<ChatProgress progress={progress} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders planning phase', () => {
    const progress: ChatProgressType = {
      phase: 'planning',
      queriedSources: [],
      completedSources: [],
    };

    render(<ChatProgress progress={progress} />);

    expect(screen.getByText('Planning query...')).toBeInTheDocument();
  });

  it('renders querying phase with sources', () => {
    const progress: ChatProgressType = {
      phase: 'querying',
      queriedSources: ['jira-issues', 'confluence'],
      completedSources: ['jira-issues'],
    };

    render(<ChatProgress progress={progress} />);

    expect(screen.getByText('Searching knowledge sources...')).toBeInTheDocument();
    expect(screen.getByText(/jira-issues/)).toBeInTheDocument();
    expect(screen.getByText(/confluence/)).toBeInTheDocument();
  });

  it('shows completed sources with checkmark', () => {
    const progress: ChatProgressType = {
      phase: 'querying',
      queriedSources: ['jira-issues', 'confluence'],
      completedSources: ['jira-issues'],
    };

    render(<ChatProgress progress={progress} />);

    const jiraSource = screen.getByText(/jira-issues/);
    const confluenceSource = screen.getByText(/confluence/);

    expect(jiraSource.textContent).toContain('✓');
    expect(confluenceSource.textContent).toContain('○');
  });

  it('renders synthesizing phase', () => {
    const progress: ChatProgressType = {
      phase: 'synthesizing',
      queriedSources: ['jira-issues'],
      completedSources: ['jira-issues'],
    };

    render(<ChatProgress progress={progress} />);

    expect(screen.getByText('Generating response...')).toBeInTheDocument();
  });

  it('shows spinner during loading', () => {
    const progress: ChatProgressType = {
      phase: 'planning',
      queriedSources: [],
      completedSources: [],
    };

    render(<ChatProgress progress={progress} />);

    expect(document.querySelector('.chat-progress__spinner')).toBeInTheDocument();
  });
});
