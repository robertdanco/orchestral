import { useEffect, useRef, useCallback } from 'react';
import { useChat } from '../hooks/useChat';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { ChatProgress } from '../components/ChatProgress';
import type { Citation, JiraIssueCitation } from '../types/chat';
import type { JiraItem } from '../types';
import './ChatView.css';

interface ChatViewProps {
  onSelectIssue?: (item: JiraItem) => void;
}

export function ChatView({ onSelectIssue }: ChatViewProps) {
  const {
    messages,
    isLoading,
    error,
    progress,
    sources,
    sendMessage,
    clearError,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, progress.phase]);

  const handleCitationClick = useCallback(
    (citation: Citation) => {
      // If it's a Jira issue citation, open the detail panel
      if (
        citation.type === 'jira-issue' &&
        citation.metadata &&
        'item' in citation.metadata
      ) {
        const jiraCitation = citation as JiraIssueCitation;
        onSelectIssue?.(jiraCitation.metadata.item);
      } else if (citation.url) {
        // For other citations with URLs, open in new tab
        window.open(citation.url, '_blank', 'noopener,noreferrer');
      }
    },
    [onSelectIssue]
  );

  return (
    <div className="chat-view">
      <div className="chat-view__messages">
        {messages.length === 0 && !isLoading && (
          <div className="chat-view__empty">
            <h2 className="chat-view__empty-title">Ask about your project</h2>
            <p className="chat-view__empty-description">
              I can help you understand your Jira issues, find blocked items,
              identify what needs attention, and more.
            </p>
            {sources.length > 0 && (
              <div className="chat-view__suggestions">
                <p className="chat-view__suggestions-label">Try asking:</p>
                <div className="chat-view__suggestion-list">
                  {sources
                    .flatMap((s) => s.exampleQueries.slice(0, 2))
                    .slice(0, 4)
                    .map((query, idx) => (
                      <button
                        key={idx}
                        className="chat-view__suggestion"
                        onClick={() => sendMessage(query)}
                      >
                        {query}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onCitationClick={handleCitationClick}
          />
        ))}

        {isLoading && <ChatProgress progress={progress} />}

        {error && (
          <div className="chat-view__error">
            <p>{error}</p>
            <button onClick={clearError}>Dismiss</button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
