import type { ChatMessage as ChatMessageType, Citation } from '../types/chat';
import './ChatMessage.css';

interface ChatMessageProps {
  message: ChatMessageType;
  onCitationClick?: (citation: Citation) => void;
}

export function ChatMessage({ message, onCitationClick }: ChatMessageProps): JSX.Element {
  const isUser = message.role === 'user';

  // Parse content to find citation markers like [1], [2] and make them clickable
  const renderContent = () => {
    if (!message.citations || message.citations.length === 0) {
      return <p className="chat-message__text">{message.content}</p>;
    }

    // Split content by citation markers and rebuild with clickable refs
    const parts = message.content.split(/(\[\d+\])/g);

    return (
      <p className="chat-message__text">
        {parts.map((part, idx) => {
          const match = part.match(/\[(\d+)\]/);
          if (match) {
            const citationIndex = parseInt(match[1], 10) - 1;
            const citation = message.citations?.[citationIndex];
            if (citation) {
              return (
                <button
                  key={idx}
                  className="chat-message__citation-ref"
                  onClick={() => onCitationClick?.(citation)}
                  title={citation.title}
                >
                  {part}
                </button>
              );
            }
          }
          return <span key={idx}>{part}</span>;
        })}
      </p>
    );
  };

  return (
    <div
      className={`chat-message chat-message--${isUser ? 'user' : 'assistant'}`}
    >
      <div className="chat-message__avatar">
        {isUser ? 'You' : 'AI'}
      </div>
      <div className="chat-message__content">
        {renderContent()}
        {message.citations && message.citations.length > 0 && (
          <div className="chat-message__citations">
            <span className="chat-message__citations-label">Sources:</span>
            <div className="chat-message__citations-list">
              {message.citations.map((citation, idx) => (
                <button
                  key={citation.id}
                  className="chat-message__citation"
                  onClick={() => onCitationClick?.(citation)}
                >
                  <span className="chat-message__citation-index">
                    [{idx + 1}]
                  </span>
                  <span className="chat-message__citation-title">
                    {citation.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
