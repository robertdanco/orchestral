import type { ChatProgress as ChatProgressType } from '../types/chat';
import './ChatProgress.css';

interface ChatProgressProps {
  progress: ChatProgressType;
}

const phaseLabels: Record<ChatProgressType['phase'], string> = {
  idle: '',
  planning: 'Planning query...',
  querying: 'Searching knowledge sources...',
  synthesizing: 'Generating response...',
};

export function ChatProgress({ progress }: ChatProgressProps) {
  if (progress.phase === 'idle') {
    return null;
  }

  return (
    <div className="chat-progress">
      <div className="chat-progress__spinner" />
      <div className="chat-progress__content">
        <span className="chat-progress__phase">{phaseLabels[progress.phase]}</span>
        {progress.phase === 'querying' && progress.queriedSources.length > 0 && (
          <div className="chat-progress__sources">
            {progress.queriedSources.map((sourceId) => {
              const isCompleted = progress.completedSources.includes(sourceId);
              return (
                <span
                  key={sourceId}
                  className={`chat-progress__source ${
                    isCompleted ? 'chat-progress__source--completed' : ''
                  }`}
                >
                  {isCompleted ? '✓' : '○'} {sourceId}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
