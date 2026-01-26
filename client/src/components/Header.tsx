import { Logo } from './Logo';
import './Header.css';

interface HeaderProps {
  lastRefreshed: Date | null;
  loading: boolean;
  onRefresh: () => void;
}

export function Header({ lastRefreshed, loading, onRefresh }: HeaderProps): JSX.Element {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <header className="header">
      <div className="header__brand">
        <Logo size={36} animated />
        <h1 className="header__title">Orchestral</h1>
      </div>
      <div className="header__actions">
        {lastRefreshed && (
          <span className="header__refreshed">
            Last refreshed: {formatTime(lastRefreshed)}
          </span>
        )}
        <button
          className="header__refresh-btn"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </header>
  );
}
