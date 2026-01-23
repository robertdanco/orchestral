import type { ConfluenceActionItem, ConfluenceComment } from '@orchestral/shared';
import type { ConfluenceClient } from '../confluence/client.js';
import type { ConfluenceCache } from '../confluence/cache.js';

type ConfluenceActionCategory = ConfluenceActionItem['category'];

const CATEGORY_PRIORITY: Record<ConfluenceActionCategory, ConfluenceActionItem['priority']> = {
  'mention': 'high',
  'reply-needed': 'medium',
  'unresolved-comment': 'low',
};

function mapToConfluenceActionItem(
  comment: ConfluenceComment,
  category: ConfluenceActionCategory,
  reason: string
): ConfluenceActionItem {
  return {
    id: `confluence-${comment.id}-${category}`,
    source: 'confluence',
    title: `Comment on "${comment.pageTitle}"`,
    reason,
    url: `${comment.spaceKey ? `/wiki/spaces/${comment.spaceKey}/pages/${comment.pageId}` : `/wiki/pages/viewpage.action?pageId=${comment.pageId}`}#comment-${comment.id}`,
    createdAt: comment.createdAt,
    priority: CATEGORY_PRIORITY[category],
    category,
    pageId: comment.pageId,
    pageTitle: comment.pageTitle,
    spaceKey: comment.spaceKey,
    commentId: comment.id,
    authorName: comment.author.displayName,
  };
}

export async function detectConfluenceActions(
  client: ConfluenceClient,
  cache: ConfluenceCache,
  currentUserId: string,
  baseUrl: string
): Promise<ConfluenceActionItem[]> {
  const actionItems: ConfluenceActionItem[] = [];
  const seenCommentIds = new Set<string>();

  try {
    // Fetch recent comments (last 7 days)
    const recentComments = await client.fetchRecentComments(7);

    // Build a map of comment IDs to comments for parent lookup
    const commentMap = new Map<string, ConfluenceComment>();
    for (const comment of recentComments) {
      commentMap.set(comment.id, comment);
    }

    // Get pages authored by current user for unresolved comment detection
    let authoredPageIds: string[] = [];
    try {
      authoredPageIds = await client.fetchPagesAuthoredByUser(currentUserId);
    } catch {
      // Ignore errors - just won't detect unresolved comments on authored pages
    }
    const authoredPageIdSet = new Set(authoredPageIds);

    // Also get any cached comments (which may have been from page-specific fetches)
    const cachedPages = cache.getPages();
    const pageIdToInfo = new Map<string, { title: string; spaceKey: string }>();
    for (const page of cachedPages) {
      pageIdToInfo.set(page.id, { title: page.title, spaceKey: page.spaceKey });
    }

    for (const comment of recentComments) {
      // Enrich comment with page info if missing
      if (!comment.pageTitle && comment.pageId) {
        const pageInfo = pageIdToInfo.get(comment.pageId);
        if (pageInfo) {
          comment.pageTitle = pageInfo.title;
          comment.spaceKey = pageInfo.spaceKey;
        }
      }

      // Fix URL to be absolute
      const commentUrl = `${baseUrl}/wiki/spaces/${comment.spaceKey}/pages/${comment.pageId}#comment-${comment.id}`;

      // 1. Check for @mentions of current user
      if (comment.mentions.includes(currentUserId)) {
        if (!seenCommentIds.has(`${comment.id}-mention`)) {
          seenCommentIds.add(`${comment.id}-mention`);
          const item = mapToConfluenceActionItem(comment, 'mention', `${comment.author.displayName} mentioned you`);
          item.url = commentUrl;
          actionItems.push(item);
        }
      }

      // 2. Check for replies to comments authored by current user
      if (comment.parentCommentId) {
        // Try to find parent comment
        const parentComment = commentMap.get(comment.parentCommentId);
        if (parentComment && parentComment.author.accountId === currentUserId) {
          if (!seenCommentIds.has(`${comment.id}-reply`)) {
            seenCommentIds.add(`${comment.id}-reply`);
            const item = mapToConfluenceActionItem(comment, 'reply-needed', `${comment.author.displayName} replied to your comment`);
            item.url = commentUrl;
            actionItems.push(item);
          }
        }
      }

      // 3. Check for unresolved comments on pages authored by current user
      if (!comment.resolved && authoredPageIdSet.has(comment.pageId)) {
        // Only include if the comment author is not the current user
        if (comment.author.accountId !== currentUserId) {
          if (!seenCommentIds.has(`${comment.id}-unresolved`)) {
            seenCommentIds.add(`${comment.id}-unresolved`);
            const item = mapToConfluenceActionItem(comment, 'unresolved-comment', `Unresolved comment by ${comment.author.displayName} on your page`);
            item.url = commentUrl;
            actionItems.push(item);
          }
        }
      }
    }

    // Sort by priority (high first) then by created date (newest first)
    actionItems.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  } catch (error) {
    // Log error but don't throw - partial results are better than none
    console.error('Error detecting Confluence actions:', error);
  }

  return actionItems;
}
