import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from './ChatInput';

describe('ChatInput', () => {
  const mockOnSend = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders with placeholder', () => {
    render(<ChatInput onSend={mockOnSend} />);

    expect(screen.getByPlaceholderText('Ask about your Jira issues...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<ChatInput onSend={mockOnSend} placeholder="Custom placeholder" />);

    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('sends message on button click', async () => {
    const user = userEvent.setup();

    render(<ChatInput onSend={mockOnSend} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(mockOnSend).toHaveBeenCalledWith('Hello');
  });

  it('sends message on Enter key', async () => {
    const user = userEvent.setup();

    render(<ChatInput onSend={mockOnSend} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello{enter}');

    expect(mockOnSend).toHaveBeenCalledWith('Hello');
  });

  it('does not send on Shift+Enter (allows newlines)', async () => {
    const user = userEvent.setup();

    render(<ChatInput onSend={mockOnSend} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Line 1{shift>}{enter}{/shift}Line 2');

    expect(mockOnSend).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('Line 1\nLine 2');
  });

  it('disables send button when empty', () => {
    render(<ChatInput onSend={mockOnSend} />);

    const sendButton = screen.getByRole('button', { name: 'Send message' });
    expect(sendButton).toBeDisabled();
  });

  it('enables send button when there is text', async () => {
    const user = userEvent.setup();

    render(<ChatInput onSend={mockOnSend} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello');

    const sendButton = screen.getByRole('button', { name: 'Send message' });
    expect(sendButton).not.toBeDisabled();
  });

  it('disables input when disabled prop is true', () => {
    render(<ChatInput onSend={mockOnSend} disabled />);

    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
  });

  it('clears input after sending', async () => {
    const user = userEvent.setup();

    render(<ChatInput onSend={mockOnSend} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(textarea).toHaveValue('');
  });

  it('trims whitespace before sending', async () => {
    const user = userEvent.setup();

    render(<ChatInput onSend={mockOnSend} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '  Hello  {enter}');

    expect(mockOnSend).toHaveBeenCalledWith('Hello');
  });

  it('does not send whitespace-only messages', async () => {
    const user = userEvent.setup();

    render(<ChatInput onSend={mockOnSend} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '   {enter}');

    expect(mockOnSend).not.toHaveBeenCalled();
  });
});
