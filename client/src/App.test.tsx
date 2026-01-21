import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders navigation links', () => {
    render(<App />);

    expect(screen.getByText('Kanban')).toBeInTheDocument();
    expect(screen.getByText('Tree')).toBeInTheDocument();
    expect(screen.getByText('Action Required')).toBeInTheDocument();
  });

  it('shows Kanban view by default', () => {
    render(<App />);

    expect(screen.getByText(/Kanban View/)).toBeInTheDocument();
  });
});
