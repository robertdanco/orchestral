import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { api } from './api';

vi.mock('./api');

describe('App', () => {
  beforeEach(() => {
    // Mock onboarding as complete so tests can access main app
    vi.mocked(api.getOnboardingStatus).mockResolvedValue({
      isComplete: true,
      settings: {
        selectedProjectKeys: ['TEST'],
        selectedSpaceKeys: [],
        completedAt: new Date().toISOString(),
      },
    });
    vi.mocked(api.getIssues).mockResolvedValue({
      issues: [],
      lastRefreshed: new Date().toISOString(),
    });
    vi.mocked(api.getHierarchy).mockResolvedValue([]);
    vi.mocked(api.getActions).mockResolvedValue({
      blockers: [],
      blocked: [],
      stale: [],
      missingDetails: [],
      unassigned: [],
      unestimated: [],
    });
  });

  it('renders header and navigation', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Orchestral')).toBeInTheDocument();
    });

    expect(screen.getByText('Kanban')).toBeInTheDocument();
    expect(screen.getByText('Tree')).toBeInTheDocument();
    expect(screen.getByText('Action Required')).toBeInTheDocument();
  });

  it('shows refresh button', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });
});
