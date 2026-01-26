import './EmptyState.css';

export interface EmptyStateConfig {
  icon: string;
  title: string;
  subtitle: string;
}

interface EmptyStateProps extends EmptyStateConfig {
  className?: string;
}

export function EmptyState({ icon, title, subtitle, className }: EmptyStateProps): JSX.Element {
  return (
    <div className={`empty-state${className ? ` ${className}` : ''}`}>
      <div className="empty-state__icon">{icon}</div>
      <div className="empty-state__title">{title}</div>
      <div className="empty-state__subtitle">{subtitle}</div>
    </div>
  );
}
