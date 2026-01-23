# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Orchestral is a Jira visualization tool for PMs to track team work. It's a monorepo with an Express backend (`server/`) and React frontend (`client/`).

## Commands

```bash
# Development
npm run dev              # Start both server (3001) and client (3000) concurrently
npm run dev:server       # Server only with hot reload
npm run dev:client       # Client only with hot reload

# Testing
npm test                 # Run all tests (server + client)
npm run test:server      # Server tests only
cd client && npm test    # Client tests only (no root script)
cd server && npm run test:watch  # Watch mode for server
cd client && npm run test:watch  # Watch mode for client

# Build
cd client && npm run build  # Production build (runs tsc first)

# Install dependencies after clone
npm run install:all
```

## Architecture

### Data Flow
```
Jira Cloud API → JiraClient → Cache → Routes → React Hooks → Views
```

### Server (`server/src/`)
- `jira/client.ts` - Jira Cloud API client with Basic auth
- `cache.ts` - In-memory cache for issues (populated on first request or refresh)
- `hierarchy.ts` - Builds parent-child tree from flat issues using `parentKey`
- `actions.ts` - Detects issues needing attention (blocked, stale, unassigned, unestimated)
- `routes.ts` - API endpoints mounted at `/api`
- `confluence/` - Confluence Cloud API client, cache, and hierarchy builder (same auth as Jira)
- `confluence-routes.ts` - Confluence API endpoints mounted at `/api/confluence`
- `action-items/` - Aggregates actionable items from Jira, Confluence, and manual items
  - `manual-cache.ts` - File-based persistence for manual items (saves to `data/manual-items.json`)
  - `manual-routes.ts` - CRUD endpoints for manual items

### Client (`client/src/`)
- `hooks/` - Data fetching hooks (`useIssues`, `useHierarchy`, `useActions`, `useChat`, `useConfluence`, `useActionItems`) with loading/error states
- `views/` - Main views: `KanbanView`, `TreeView`, `ActionsView`, `ChatView`, `ConfluenceView`, `ActionItemsView` (has utils.ts with shared grouping/labels)
- `components/` - `IssueCard`, `DetailPanel` (side panel), `Header`, `ChatMessage`, `ChatInput`, `ChatProgress`
- `api.ts` - Fetch wrapper for server endpoints

### Chat System (`server/src/chat/`)
The chat feature provides an AI assistant with pluggable knowledge sources:
- `types.ts` - Core interfaces (KnowledgeSource, Citation, QueryPlan, etc.)
- `llm/client.ts` - Anthropic API client abstraction
- `llm/prompts.ts` - System prompts for planning and synthesis
- `planner.ts` - LLM-based query planning to select relevant sources
- `executor.ts` - Executes query plans (parallel/sequential source queries)
- `synthesizer.ts` - Generates natural language responses with citations
- `service.ts` - Orchestrates the full chat flow
- `routes.ts` - Chat API endpoints
- `sources/jira-issues.ts` - Reference implementation querying the Jira cache

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/issues` | GET | All issues with `lastRefreshed` timestamp |
| `/api/issues/:key` | GET | Single issue |
| `/api/hierarchy` | GET | Issues as nested tree |
| `/api/actions` | GET | Issues needing PM attention |
| `/api/refresh` | POST | Clear cache and refetch from Jira |
| `/api/health` | GET | Health check |
| `/api/chat` | POST | Send message, get response |
| `/api/chat/stream` | POST | Send message, stream response via SSE |
| `/api/chat/sources` | GET | List available knowledge sources |
| `/api/chat/session/:id` | GET | Get session history |
| `/api/chat/session/:id` | DELETE | Delete a session |
| `/api/confluence/spaces` | GET | List Confluence spaces |
| `/api/confluence/pages` | GET | List all pages |
| `/api/confluence/pages/:id` | GET | Single page with content |
| `/api/confluence/hierarchy` | GET | Spaces with nested page trees |
| `/api/confluence/search` | GET | Search pages (`?q=query`) |
| `/api/confluence/refresh` | POST | Clear cache and refetch |
| `/api/action-items` | GET | Aggregated action items from all sources |
| `/api/action-items/manual` | GET | List all manual items |
| `/api/action-items/manual` | POST | Create manual item |
| `/api/action-items/manual/:id` | GET | Get single manual item |
| `/api/action-items/manual/:id` | PUT | Update manual item |
| `/api/action-items/manual/:id` | DELETE | Delete manual item |
| `/api/action-items/manual/:id/complete` | POST | Mark item complete |
| `/api/action-items/manual/:id/incomplete` | POST | Mark item incomplete |

### Shared Types (`shared/src/`)
The `@orchestral/shared` package contains types used by both server and client:
- `JiraItem`, `HierarchicalJiraItem` - Core issue types
- `ActionRequiredItem`, `ActionRequiredResult` - Action detection types
- `ActionItem`, `JiraActionItem`, `ConfluenceActionItem`, `ManualActionItem` - Unified action item types
- `ManualActionCategory` - Categories: task, followup, decision, reminder
- `CreateManualActionItemInput`, `UpdateManualActionItemInput` - CRUD input types
- `ConfluenceUser`, `ConfluenceComment` - Confluence comment types
- `IssuesResponse`, `HierarchyResponse` - API response types
- `isValidJiraItem()` - Runtime type validation

Both `server/src/types.ts` and `client/src/types.ts` re-export from shared.

## Environment Variables

Copy `.env.example` to `.env` in the root:
```
JIRA_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=you@yourcompany.com
JIRA_API_TOKEN=your-api-token
JIRA_PROJECT_KEYS=PROJ,TEAM

# Optional: Limit Confluence to specific spaces (uses same Atlassian credentials)
CONFLUENCE_SPACE_KEYS=DOCS,ENG

# Optional: Enable AI chat feature
ANTHROPIC_API_KEY=sk-ant-...
```

## Claude Code Hooks

The project has protective hooks in `.claude/settings.local.json`:
- **PreToolUse**: Blocks edits to `.env` files (credentials protection) - `.env.example` is allowed
- **PostToolUse**: Runs `tsc --noEmit` in server/ and client/ after every file edit

If a hook blocks an action, the error message will explain why.

## Testing

Tests use Vitest and are co-located with source files (`*.test.ts`/`*.test.tsx`). Server tests use `supertest` for API testing. Client tests use `@testing-library/react`.

Run a single test file:
```bash
cd server && npx vitest run src/cache.test.ts
cd client && npx vitest run src/hooks/useIssues.test.ts
```

## Tool Use Examples

### Running Tests - Interpreting Failures
```bash
# When you see this error:
FAIL src/cache.test.ts > cache > should return cached data
  AssertionError: expected undefined to equal {...}

# The pattern is: Check if the cache was populated before the assertion
# Fix: Ensure `populateCache()` is called in beforeEach
```

### Type Mismatch Between Server/Client
```bash
# When client/src/types.ts differs from server/src/types.ts:
# 1. Read both files
# 2. Identify the canonical source (usually server)
# 3. Update the other to match exactly
```

### API Response Format
```json
// GET /api/issues returns:
{
  "issues": [...],
  "lastRefreshed": "2024-01-15T10:30:00.000Z"
}

// GET /api/hierarchy returns nested structure:
{
  "roots": [{ "item": {...}, "children": [...] }],
  "lastRefreshed": "..."
}
```

### Monorepo Navigation Pattern
```bash
# This is an npm workspaces monorepo (shared, server, client)
# Always specify which workspace when running commands:
cd server && npx tsc --noEmit    # Server TypeScript check
cd client && npx tsc --noEmit    # Client TypeScript check

# Or from root:
npm run test:server              # Server tests only
npm run test:client              # Client tests only

# When modifying shared types, rebuild shared first:
cd shared && npm run build
```

### Client Structure
- Global styles in `client/src/index.css` with CSS custom properties (`:root` variables for colors)
- Components have co-located CSS files (e.g., `Header.css`, `Sidebar.css`) that use these variables
- Sidebar navigation uses data-driven `sections` array in `Sidebar.tsx` for extensibility
- Data hooks expose granular loading states: `isInitialLoad` (first fetch) and `isRefreshing` (subsequent fetches)

## Adding Knowledge Sources

To add a new knowledge source to the chat system:

1. Create a class implementing `KnowledgeSource` in `server/src/chat/sources/`:
```typescript
import type { KnowledgeSource, KnowledgeSourceMetadata, QueryContext, KnowledgeSourceResult } from '../types.js';

export class MySource implements KnowledgeSource {
  metadata: KnowledgeSourceMetadata = {
    id: 'my-source',
    name: 'My Source',
    description: 'What this source contains',
    capabilities: ['What queries it can answer'],
    exampleQueries: ['Example question?'],
    priority: 2,
  };

  async query(context: QueryContext): Promise<KnowledgeSourceResult> {
    // Query your data source and return results with citations
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}
```

2. Register the source in `server/src/index.ts`:
```typescript
chatService.registerSource(new MySource());
```

## Adding Action Item Sources

To add a new action item source (like Manual items):
1. Add types in `shared/src/action-items.ts` (new interface extending `ActionItemBase`, update `ActionItem` union, add section to `ActionItemsResponse`)
2. Rebuild shared: `cd shared && npm run build`
3. Create server cache class in `server/src/action-items/` with persistence logic
4. Create server routes and mount in main routes file
5. Add section to `Promise.allSettled` in `/api/action-items` response aggregation
6. Add client API methods, hook mutations, and view components (Tab + Form pattern)

## Gotchas

- Manual action items persist to `data/manual-items.json` (file-based storage); JSON files are gitignored but the directory has `.gitkeep`
- When aggregating from multiple sources (Jira + Confluence + Manual), use `Promise.allSettled` to handle partial failures gracefully
- Confluence client supports CQL queries via `/wiki/rest/api/content/search` for comments/pages search
- Sidebar badges are driven by props from App.tsx; pass counts down to enable notification badges
- Client build runs `tsc` first - unused imports (even in test files) cause build failure
- Unused function parameters should use underscore prefix (e.g., `_options`) to avoid TS6133 errors
- TreeView nodes at level < 2 start expanded; tests should use `getAllByText` for toggle buttons since multiple exist
- Server routes only mount when all Jira env vars are set; `/api/health` always works for testing
- jsdom doesn't implement `scrollIntoView` - tests that use it need `Element.prototype.scrollIntoView = vi.fn()` mock
- When testing async state transitions (like `isRefreshing`), avoid synchronous assertions immediately after calling async functions; use `waitFor` to check final state
- Hook mutation pattern: For CRUD operations, add methods that call API then `fetchActionItems()` to refresh data (see `useActionItems.ts`)
