# CLAUDE.md

## Project Overview
Orchestral is a Jira visualization tool for PMs. Monorepo: Express backend (`server/`), React frontend (`client/`), shared types (`shared/`).

## Commands
```bash
npm run dev              # Start both (server:3001, client:3000)
npm test                 # All tests
npm run test:server      # Server tests only
cd client && npm test    # Client tests only
cd shared && npm run build  # Rebuild shared types after changes
```

## Architecture

**Data Flow:** `Jira API → Cache → Routes → React Hooks → Views`

### Server (`server/src/`)
- `jira/client.ts`, `cache.ts`, `routes.ts` - Core Jira integration
- `confluence/` - Confluence API (same Atlassian auth)
- `slack/` - Optional Slack integration (`SLACK_BOT_TOKEN`)
- `google/` - Optional Google Docs integration (service account)
- `action-items/` - Aggregates items from all sources
- `chat/` - AI assistant with pluggable knowledge sources
- `cache/types.ts` - `ICache` interface for all caches

### Client (`client/src/`)
- `hooks/` - Data hooks with `isInitialLoad`/`isRefreshing` states; use `useLoadingState` helper
- `views/` - Main views; `ActionItemsView/` uses generic `ActionItemsTab` component
- `components/` - Reusable components; `EmptyState` for empty states

### Shared (`shared/src/`)
Types shared between server/client. After changes: `cd shared && npm run build`

## Environment Variables
See `.env.example`. Required: `JIRA_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEYS`

Optional integrations:
- Confluence: Uses same Jira auth, `CONFLUENCE_SPACE_KEYS` to limit spaces
- Chat: `ANTHROPIC_API_KEY`
- Slack: `SLACK_BOT_TOKEN`, `SLACK_CHANNEL_IDS`
- Google Docs: `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` or `GOOGLE_SERVICE_ACCOUNT_KEY`

## Patterns

### Adding New Features
- **Knowledge source:** Implement `KnowledgeSource` interface (see `chat/sources/jira-issues.ts`)
- **Action item source:** Add type to shared, create cache/routes, add to `Promise.allSettled` aggregation
- **Shared types:** Update `shared/src/index.ts` AND `client/src/types.ts`

### Code Style
- CSS: MD3 tokens (`--md-sys-color-{role}`), co-located `.css` files
- Hooks: Use `useLoadingState` for loading/error states
- Optional integrations: Pass optional params (`slackClient?: SlackClient`), check existence
- Detection functions: Process cached data only, don't fetch

## Gotchas

### TypeScript
- Unused imports fail client build (runs tsc first)
- Unused params: prefix with underscore (`_options`)

### Testing
- jsdom: Mock `scrollIntoView` with `vi.fn()`
- Async states: Use `waitFor`, don't assert synchronously after async calls
- Time filters: Use relative dates, not hardcoded past dates
- Multiple elements: Use `getByRole('heading', {...})` for specificity

### Integrations
- Slack/Google: Optional, return empty arrays when env vars missing
- Manual items: Persist to `data/manual-items.json`
- Caches: In-memory except manual items
- Multi-source aggregation: Use `Promise.allSettled` for partial failure handling

### CSS
- Verify CSS classes used in TSX before removing (may be dead code)
