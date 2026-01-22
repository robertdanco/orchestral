// Jira Issues knowledge source - queries cached Jira issues

import { Cache } from '../../cache.js';
import { detectActionRequired, type ActionConfig } from '../../actions.js';
import type { JiraItem } from '../../types.js';
import type {
  KnowledgeSource,
  KnowledgeSourceMetadata,
  QueryContext,
  KnowledgeSourceResult,
  Citation,
  JiraIssueCitation,
} from '../types.js';

const DEFAULT_ACTION_CONFIG: ActionConfig = {
  staleDays: 5,
  requireEstimates: true,
};

export class JiraIssuesSource implements KnowledgeSource {
  private cache: Cache;

  metadata: KnowledgeSourceMetadata = {
    id: 'jira-issues',
    name: 'Jira Issues',
    description:
      'Current Jira issues for the project including epics, stories, tasks, and bugs. Contains status, assignee, estimates, blocked status, and hierarchy information.',
    capabilities: [
      'List all issues by type or status',
      'Find blocked issues and blockers',
      'Find stale issues (in progress but not updated)',
      'Find unassigned issues',
      'Find unestimated stories',
      'Search issues by assignee',
      'Show issue hierarchy (initiatives → epics → stories)',
      'Get issue counts by status category',
    ],
    exampleQueries: [
      'What issues are blocked?',
      'Which stories are unassigned?',
      'Show me all epics',
      'What is John working on?',
      "How many issues are in progress?",
      'What needs attention?',
    ],
    priority: 1,
  };

  constructor(cache: Cache) {
    this.cache = cache;
  }

  async isAvailable(): Promise<boolean> {
    // Cache is always available, though may be empty
    return true;
  }

  async query(context: QueryContext): Promise<KnowledgeSourceResult> {
    const issues = this.cache.getIssues();
    const query = context.query.toLowerCase();

    // Detect what kind of query this is and filter/structure accordingly
    const result = this.processQuery(query, issues);

    return {
      sourceId: this.metadata.id,
      data: result.data,
      citations: result.citations,
    };
  }

  private processQuery(
    query: string,
    issues: JiraItem[]
  ): { data: unknown; citations: Citation[] } {
    // Check for action-required queries
    if (this.isActionQuery(query)) {
      return this.handleActionQuery(query, issues);
    }

    // Check for type-specific queries
    if (this.isTypeQuery(query)) {
      return this.handleTypeQuery(query, issues);
    }

    // Check for status queries
    if (this.isStatusQuery(query)) {
      return this.handleStatusQuery(query, issues);
    }

    // Check for assignee queries
    if (this.isAssigneeQuery(query)) {
      return this.handleAssigneeQuery(query, issues);
    }

    // Check for summary/statistics queries
    if (this.isSummaryQuery(query)) {
      return this.handleSummaryQuery(issues);
    }

    // Default: return a summary with top issues
    return this.handleGeneralQuery(issues);
  }

  private isActionQuery(query: string): boolean {
    const actionKeywords = [
      'blocked',
      'blocker',
      'stale',
      'unassigned',
      'attention',
      'action',
      'needs',
      'problem',
      'issue',
      'stuck',
      'unestimated',
    ];
    return actionKeywords.some((kw) => query.includes(kw));
  }

  private isTypeQuery(query: string): boolean {
    const typeKeywords = ['epic', 'story', 'task', 'bug', 'initiative'];
    return typeKeywords.some((kw) => query.includes(kw));
  }

  private isStatusQuery(query: string): boolean {
    const statusKeywords = [
      'in progress',
      'todo',
      'done',
      'completed',
      'open',
      'closed',
    ];
    return statusKeywords.some((kw) => query.includes(kw));
  }

  private isAssigneeQuery(query: string): boolean {
    const assigneeKeywords = [
      'assigned to',
      'working on',
      'who is',
      'assignee',
    ];
    return assigneeKeywords.some((kw) => query.includes(kw));
  }

  private isSummaryQuery(query: string): boolean {
    const summaryKeywords = [
      'how many',
      'count',
      'summary',
      'overview',
      'statistics',
      'stats',
    ];
    return summaryKeywords.some((kw) => query.includes(kw));
  }

  private handleActionQuery(
    query: string,
    issues: JiraItem[]
  ): { data: unknown; citations: Citation[] } {
    const actions = detectActionRequired(issues, DEFAULT_ACTION_CONFIG);
    const citations: Citation[] = [];
    const data: Record<string, unknown> = {};

    // Determine which action types to include based on query
    const includeBlocked =
      query.includes('blocked') || query.includes('attention');
    const includeBlockers =
      query.includes('blocker') || query.includes('attention');
    const includeStale =
      query.includes('stale') ||
      query.includes('stuck') ||
      query.includes('attention');
    const includeUnassigned =
      query.includes('unassigned') || query.includes('attention');
    const includeUnestimated =
      query.includes('unestimated') || query.includes('attention');

    if (includeBlockers && actions.blockers.length > 0) {
      data.blockers = actions.blockers.map((a) => ({
        key: a.item.key,
        summary: a.item.summary,
        reason: a.reason,
      }));
      for (const action of actions.blockers) {
        citations.push(this.createCitation(action.item, action.reason));
      }
    }

    if (includeBlocked && actions.blocked.length > 0) {
      data.blocked = actions.blocked.map((a) => ({
        key: a.item.key,
        summary: a.item.summary,
        reason: a.reason,
      }));
      for (const action of actions.blocked) {
        citations.push(this.createCitation(action.item, action.reason));
      }
    }

    if (includeStale && actions.stale.length > 0) {
      data.stale = actions.stale.map((a) => ({
        key: a.item.key,
        summary: a.item.summary,
        reason: a.reason,
      }));
      for (const action of actions.stale) {
        citations.push(this.createCitation(action.item, action.reason));
      }
    }

    if (includeUnassigned && actions.unassigned.length > 0) {
      data.unassigned = actions.unassigned.map((a) => ({
        key: a.item.key,
        summary: a.item.summary,
        type: a.item.type,
      }));
      for (const action of actions.unassigned) {
        citations.push(this.createCitation(action.item, action.reason));
      }
    }

    if (includeUnestimated && actions.unestimated.length > 0) {
      data.unestimated = actions.unestimated.map((a) => ({
        key: a.item.key,
        summary: a.item.summary,
      }));
      for (const action of actions.unestimated) {
        citations.push(this.createCitation(action.item, action.reason));
      }
    }

    // Deduplicate citations by issue key
    const uniqueCitations = this.deduplicateCitations(citations);

    return { data, citations: uniqueCitations };
  }

  private handleTypeQuery(
    query: string,
    issues: JiraItem[]
  ): { data: unknown; citations: Citation[] } {
    const types: Array<JiraItem['type']> = [];
    if (query.includes('epic')) types.push('epic');
    if (query.includes('story') || query.includes('stories'))
      types.push('story');
    if (query.includes('task')) types.push('task');
    if (query.includes('bug')) types.push('bug');
    if (query.includes('initiative')) types.push('initiative');

    const filtered = issues.filter((i) => types.includes(i.type));
    const citations = filtered.map((item) => this.createCitation(item));

    return {
      data: {
        types,
        count: filtered.length,
        issues: filtered.map((i) => ({
          key: i.key,
          summary: i.summary,
          status: i.status,
          assignee: i.assignee,
          type: i.type,
        })),
      },
      citations,
    };
  }

  private handleStatusQuery(
    query: string,
    issues: JiraItem[]
  ): { data: unknown; citations: Citation[] } {
    let statusCategory: JiraItem['statusCategory'] | null = null;

    if (query.includes('in progress')) statusCategory = 'inprogress';
    else if (query.includes('todo') || query.includes('open'))
      statusCategory = 'todo';
    else if (query.includes('done') || query.includes('completed'))
      statusCategory = 'done';

    const filtered = statusCategory
      ? issues.filter((i) => i.statusCategory === statusCategory)
      : issues;

    const citations = filtered.map((item) => this.createCitation(item));

    return {
      data: {
        statusCategory,
        count: filtered.length,
        issues: filtered.map((i) => ({
          key: i.key,
          summary: i.summary,
          status: i.status,
          assignee: i.assignee,
          type: i.type,
        })),
      },
      citations,
    };
  }

  private handleAssigneeQuery(
    query: string,
    issues: JiraItem[]
  ): { data: unknown; citations: Citation[] } {
    // Try to extract assignee name from query
    // Common patterns: "assigned to John", "what is John working on"
    const nameMatch = query.match(
      /(?:assigned to|working on|assignee)\s+(\w+)/i
    );
    const assigneeName = nameMatch?.[1]?.toLowerCase();

    let filtered: JiraItem[];
    if (assigneeName) {
      filtered = issues.filter(
        (i) =>
          i.assignee?.toLowerCase().includes(assigneeName) &&
          i.statusCategory !== 'done'
      );
    } else {
      // Return issues grouped by assignee
      const byAssignee = new Map<string, JiraItem[]>();
      for (const issue of issues) {
        if (issue.statusCategory === 'done') continue;
        const assignee = issue.assignee || 'Unassigned';
        if (!byAssignee.has(assignee)) {
          byAssignee.set(assignee, []);
        }
        byAssignee.get(assignee)!.push(issue);
      }

      const grouped = Object.fromEntries(
        Array.from(byAssignee.entries()).map(([assignee, items]) => [
          assignee,
          items.map((i) => ({ key: i.key, summary: i.summary, status: i.status })),
        ])
      );

      return {
        data: { issuesByAssignee: grouped },
        citations: issues
          .filter((i) => i.statusCategory !== 'done')
          .map((item) => this.createCitation(item)),
      };
    }

    const citations = filtered.map((item) => this.createCitation(item));

    return {
      data: {
        assignee: assigneeName,
        count: filtered.length,
        issues: filtered.map((i) => ({
          key: i.key,
          summary: i.summary,
          status: i.status,
          type: i.type,
        })),
      },
      citations,
    };
  }

  private handleSummaryQuery(
    issues: JiraItem[]
  ): { data: unknown; citations: Citation[] } {
    const byStatus = {
      todo: issues.filter((i) => i.statusCategory === 'todo').length,
      inProgress: issues.filter((i) => i.statusCategory === 'inprogress')
        .length,
      done: issues.filter((i) => i.statusCategory === 'done').length,
    };

    const byType = {
      initiatives: issues.filter((i) => i.type === 'initiative').length,
      epics: issues.filter((i) => i.type === 'epic').length,
      stories: issues.filter((i) => i.type === 'story').length,
      tasks: issues.filter((i) => i.type === 'task').length,
      bugs: issues.filter((i) => i.type === 'bug').length,
    };

    return {
      data: {
        total: issues.length,
        byStatus,
        byType,
      },
      citations: [], // Summary doesn't need citations
    };
  }

  private handleGeneralQuery(
    issues: JiraItem[]
  ): { data: unknown; citations: Citation[] } {
    // Return a helpful overview
    const inProgress = issues.filter((i) => i.statusCategory === 'inprogress');
    const blocked = issues.filter((i) => i.blocked);

    const citations = [...inProgress, ...blocked]
      .slice(0, 10)
      .map((item) => this.createCitation(item));

    return {
      data: {
        summary: {
          total: issues.length,
          inProgress: inProgress.length,
          blocked: blocked.length,
        },
        recentInProgress: inProgress.slice(0, 5).map((i) => ({
          key: i.key,
          summary: i.summary,
          assignee: i.assignee,
        })),
      },
      citations: this.deduplicateCitations(citations),
    };
  }

  private createCitation(item: JiraItem, snippet?: string): JiraIssueCitation {
    return {
      sourceId: this.metadata.id,
      type: 'jira-issue',
      id: item.key,
      title: `[${item.key}] ${item.summary}`,
      url: item.url,
      snippet: snippet || `${item.type} - ${item.status}`,
      metadata: { item },
    };
  }

  private deduplicateCitations(citations: Citation[]): Citation[] {
    const seen = new Set<string>();
    return citations.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }
}
