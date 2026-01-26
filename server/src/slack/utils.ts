/**
 * Truncates and cleans Slack text for display.
 * Removes Slack-specific formatting like user mentions, channel links, and URLs.
 */
export function truncateSlackText(text: string, maxLength: number): string {
  const cleaned = text
    .replace(/<@[A-Z0-9]+>/g, '@user') // Replace user mentions with @user
    .replace(/<#[A-Z0-9]+\|([^>]+)>/g, '#$1') // Replace channel links with #channel
    .replace(/<([^|>]+)\|([^>]+)>/g, '$2') // Replace URL links with display text
    .replace(/<([^>]+)>/g, '$1') // Remove other formatting
    .replace(/\n/g, ' ')
    .trim();

  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength - 3) + '...';
}
