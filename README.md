# Orchestral

A Jira visualization tool for PMs. Monorepo with Express backend, React frontend, and shared types.

## Project Structure

```
orchestral/
├── server/     # Express backend (port 3001)
├── client/     # React frontend (port 3000)
└── shared/     # Shared TypeScript types
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

**Required:**
- `JIRA_URL` - Your Atlassian instance URL
- `JIRA_EMAIL` - Your Atlassian email
- `JIRA_API_TOKEN` - [Generate an API token](https://id.atlassian.com/manage-profile/security/api-tokens)
- `JIRA_PROJECT_KEYS` - Comma-separated project keys to track

**Optional integrations:**
- **Confluence** - Uses same Atlassian auth; set `CONFLUENCE_SPACE_KEYS` to limit spaces
- **AI Chat** - Set `ANTHROPIC_API_KEY`
- **Slack** - Set `SLACK_BOT_TOKEN` and `SLACK_CHANNEL_IDS`
- **Google Docs** - Set `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` or `GOOGLE_SERVICE_ACCOUNT_KEY`

### Development

```bash
npm run dev          # Start both server and client
npm run dev:server   # Server only
npm run dev:client   # Client only
```

### Testing

```bash
npm test             # All tests
npm run test:server  # Server tests only
npm run test:client  # Client tests only
```

## Architecture

**Data Flow:** `Jira API → Cache → Routes → React Hooks → Views`

### Server (`server/src/`)
- `jira/` - Core Jira integration (client, cache, routes)
- `confluence/` - Confluence API integration
- `slack/` - Optional Slack integration
- `google/` - Optional Google Docs integration
- `action-items/` - Aggregates items from all sources
- `chat/` - AI assistant with pluggable knowledge sources

### Client (`client/src/`)
- `hooks/` - Data fetching hooks with loading/refreshing states
- `views/` - Main application views
- `components/` - Reusable UI components

### Shared (`shared/src/`)
TypeScript types shared between server and client. After changes:
```bash
cd shared && npm run build
```
