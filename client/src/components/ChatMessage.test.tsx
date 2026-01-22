import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatMessage } from './ChatMessage';
import type { ChatMessage as ChatMessageType, Citation } from '../types/chat';

describe('ChatMessage', () => {
  const mockUserMessage: ChatMessageType = {
    id: '1',
    role: 'user',
    content: 'Hello world',
    timestamp: new Date(),
  };

  const mockAssistantMessage: ChatMessageType = {
    id: '2',
    role: 'assistant',
    content: 'Hi there!',
    timestamp: new Date(),
  };

  it('renders user message', () => {
    render(<ChatMessage message={mockUserMessage} />);

    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('renders assistant message', () => {
    render(<ChatMessage message={mockAssistantMessage} />);

    expect(screen.getByText('Hi there!')).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('renders message with citations', async () => {
    const user = userEvent.setup();
    const mockCitationClick = vi.fn();

    const citations: Citation[] = [
      {
        sourceId: 'jira-issues',
        type: 'jira-issue',
        id: 'PROJ-1',
        title: 'Test Issue',
        url: 'https://jira.example.com/PROJ-1',
      },
    ];

    const messageWithCitations: ChatMessageType = {
      id: '3',
      role: 'assistant',
      content: 'Here is an issue [1] that needs attention.',
      citations,
      timestamp: new Date(),
    };

    render(
      <ChatMessage
        message={messageWithCitations}
        onCitationClick={mockCitationClick}
      />
    );

    expect(screen.getByText('Sources:')).toBeInTheDocument();
    expect(screen.getByText('Test Issue')).toBeInTheDocument();

    // Click on the citation in the list (the button with the title)
    await user.click(screen.getByText('Test Issue'));
    expect(mockCitationClick).toHaveBeenCalledWith(citations[0]);
  });

  it('renders citation list and handles clicks', async () => {
    const user = userEvent.setup();
    const mockCitationClick = vi.fn();

    const citations: Citation[] = [
      {
        sourceId: 'jira-issues',
        type: 'jira-issue',
        id: 'PROJ-1',
        title: 'First Issue',
        url: null,
      },
      {
        sourceId: 'jira-issues',
        type: 'jira-issue',
        id: 'PROJ-2',
        title: 'Second Issue',
        url: null,
      },
    ];

    const messageWithCitations: ChatMessageType = {
      id: '4',
      role: 'assistant',
      content: 'Two issues found.',
      citations,
      timestamp: new Date(),
    };

    render(
      <ChatMessage
        message={messageWithCitations}
        onCitationClick={mockCitationClick}
      />
    );

    // Click on citation in the list
    await user.click(screen.getByText('First Issue'));
    expect(mockCitationClick).toHaveBeenCalledWith(citations[0]);
  });
});
