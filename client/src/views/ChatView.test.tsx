import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatView } from './ChatView';
import * as useChatModule from '../hooks/useChat';

vi.mock('../hooks/useChat');

// Mock scrollIntoView which doesn't exist in jsdom
Element.prototype.scrollIntoView = vi.fn();

describe('ChatView', () => {
  const mockSendMessage = vi.fn();
  const mockClearError = vi.fn();

  const defaultUseChat = {
    messages: [],
    isLoading: false,
    error: null,
    progress: { phase: 'idle' as const, queriedSources: [], completedSources: [] },
    citations: [],
    sources: [],
    sendMessage: mockSendMessage,
    clearMessages: vi.fn(),
    clearError: mockClearError,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useChatModule.useChat).mockReturnValue(defaultUseChat);
  });

  it('renders empty state with suggestions', () => {
    vi.mocked(useChatModule.useChat).mockReturnValue({
      ...defaultUseChat,
      sources: [
        {
          id: 'jira-issues',
          name: 'Jira Issues',
          description: 'Search Jira issues',
          capabilities: [],
          exampleQueries: ['What issues are blocked?', 'Show stale items'],
          priority: 1,
        },
      ],
    });

    render(<ChatView />);

    expect(screen.getByText('Ask about your project')).toBeInTheDocument();
    expect(screen.getByText('What issues are blocked?')).toBeInTheDocument();
  });

  it('renders messages', () => {
    vi.mocked(useChatModule.useChat).mockReturnValue({
      ...defaultUseChat,
      messages: [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date(),
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Hi there!',
          timestamp: new Date(),
        },
      ],
    });

    render(<ChatView />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    vi.mocked(useChatModule.useChat).mockReturnValue({
      ...defaultUseChat,
      isLoading: true,
      progress: { phase: 'planning', queriedSources: [], completedSources: [] },
    });

    render(<ChatView />);

    expect(screen.getByText('Planning query...')).toBeInTheDocument();
  });

  it('shows error state with dismiss button', async () => {
    const user = userEvent.setup();

    vi.mocked(useChatModule.useChat).mockReturnValue({
      ...defaultUseChat,
      error: 'Something went wrong',
    });

    render(<ChatView />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    await user.click(screen.getByText('Dismiss'));
    expect(mockClearError).toHaveBeenCalled();
  });

  it('sends message when clicking suggestion', async () => {
    const user = userEvent.setup();

    vi.mocked(useChatModule.useChat).mockReturnValue({
      ...defaultUseChat,
      sources: [
        {
          id: 'jira-issues',
          name: 'Jira Issues',
          description: 'Search Jira issues',
          capabilities: [],
          exampleQueries: ['What issues are blocked?'],
          priority: 1,
        },
      ],
    });

    render(<ChatView />);

    await user.click(screen.getByText('What issues are blocked?'));
    expect(mockSendMessage).toHaveBeenCalledWith('What issues are blocked?');
  });
});
