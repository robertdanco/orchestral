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

### Client (`client/src/`)
- `hooks/` - Data fetching hooks (`useIssues`, `useHierarchy`, `useActions`, `useChat`) with loading/error states
- `views/` - Main views: `KanbanView` (status columns), `TreeView` (hierarchy), `ActionsView` (attention needed), `ChatView` (AI assistant)
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

### Key Types
The `JiraItem` type is defined in both `server/src/types.ts` and `client/src/types.ts` with: `key`, `summary`, `type`, `status`, `statusCategory`, `assignee`, `parentKey`, `estimate`, `blocked`, `blockedReason`, `url`, etc.

## Environment Variables

Copy `.env.example` to `.env` in the root:
```
JIRA_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=you@yourcompany.com
JIRA_API_TOKEN=your-api-token
JIRA_PROJECT_KEYS=PROJ,TEAM

# Optional: Enable AI chat feature
ANTHROPIC_API_KEY=sk-ant-...
```

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
# Always specify which workspace when running commands:
cd server && npx tsc --noEmit    # Server TypeScript check
cd client && npx tsc --noEmit    # Client TypeScript check

# Or from root:
npm run test:server              # Server tests only
npm run test:client              # Client tests only
```

### Client Structure
- Global styles in `client/src/index.css` (no separate App.css)
- Components have co-located CSS files (e.g., `Header.css`, `Sidebar.css`)
- Sidebar navigation uses data-driven `sections` array in `Sidebar.tsx` for extensibility

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

## Gotchas

- Client build runs `tsc` first - unused imports (even in test files) cause build failure
- Unused function parameters should use underscore prefix (e.g., `_options`) to avoid TS6133 errors
- TreeView nodes at level < 2 start expanded; tests should use `getAllByText` for toggle buttons since multiple exist
- Server routes only mount when all Jira env vars are set; `/api/health` always works for testing
- `App.test.tsx` has a pre-existing type error (mock missing `blockers` property) - tests pass at runtime but `tsc --noEmit` fails
