# Jira Visualization Tool - Design Document

**Date:** 2025-01-21
**Status:** Approved

## Overview

A personal tool for a solo PM to maintain visibility into team work and identify where PM action is needed. Fetches data from Jira Cloud and presents it through three complementary views.

## Use Cases

1. **Sprint/team tracking** - See what's in progress, blocked, done
2. **Epic/initiative overview** - Understand how work rolls up through the hierarchy
3. **Personal task management** - Track own assignments and identify PM action items

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (React SPA)                  │
│  ┌─────────────┬─────────────┬─────────────────────┐    │
│  │   Kanban    │    Tree     │   Action Required   │    │
│  │    View     │    View     │        View         │    │
│  └─────────────┴─────────────┴─────────────────────┘    │
│                         │                                │
│              ┌──────────┴──────────┐                    │
│              │    Detail Panel     │                    │
│              └─────────────────────┘                    │
└─────────────────────────────────────────────────────────┘
                          │ HTTP
┌─────────────────────────────────────────────────────────┐
│                   Express Server                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  /api/issues │  │ /api/refresh │  │  /api/config │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                          │                               │
│              ┌───────────┴───────────┐                  │
│              │    In-Memory Cache    │                  │
│              └───────────────────────┘                  │
└─────────────────────────────────────────────────────────┘
                          │ HTTPS
                ┌─────────┴─────────┐
                │   Jira Cloud API   │
                └───────────────────┘
```

### Stack

- **Frontend:** React SPA
- **Backend:** Express server (Node.js)
- **Data:** Jira Cloud REST API
- **Deployment:** Local only (localhost)

### Project Structure

```
/orchestral
  /client          # React app
  /server          # Express server
  .env             # JIRA_URL, JIRA_EMAIL, JIRA_API_TOKEN
  package.json     # Scripts to run both
```

## Data Model

### Jira Hierarchy

```
Initiative (issue type)
  └── Epic
        └── Story / Task / Bug
```

### Core Data Structure

```typescript
interface JiraItem {
  key: string;              // "PROJ-123"
  summary: string;          // Issue title
  type: "initiative" | "epic" | "story" | "task" | "bug";
  status: string;           // "To Do", "In Progress", "Done", etc.
  statusCategory: "todo" | "inprogress" | "done";
  assignee: string | null;
  parentKey: string | null;
  estimate: number | null;
  created: string;          // ISO date
  updated: string;          // ISO date
  labels: string[];
  blocked: boolean;
  blockedReason: string | null;
  url: string;              // Direct link to Jira
}
```

### API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/issues` | Returns all items, hierarchically nested |
| `GET /api/issues/:key` | Single item with full details (description, comments) |
| `POST /api/refresh` | Clears cache, re-fetches from Jira |
| `GET /api/config` | Returns project names, status mappings (no secrets) |

## Views

### Kanban View

- Columns based on status categories: To Do → In Progress → Done
- Cards show: key, summary, assignee avatar, type icon
- Cards grouped by epic (collapsible swimlanes) or flat list (toggle)
- Click card → opens detail panel
- Filter bar: by assignee, epic, label, type

### Tree View

- Hierarchical outline: Initiatives → Epics → Stories/Tasks
- Expand/collapse at any level
- Each node shows: key, summary, status badge, assignee
- Progress indicator on parent nodes (e.g., "3/7 done")
- Click any node → opens detail panel
- Same filter bar as Kanban (filters stay synced between views)

### Action Required View

A focused list of items needing PM attention, organized by problem type:

| Section | Criteria |
|---------|----------|
| **Blocked** | Has blocker flag or blocker link |
| **Stale** | In Progress but not updated in X days (configurable, default 5) |
| **Missing Details** | Stories without description or acceptance criteria |
| **Unassigned** | In To Do or In Progress with no assignee |
| **Unestimated** | Stories without story points (if you use them) |

Each item shows the problem reason and a direct link to fix it in Jira.

## Detail Panel

Slide-out panel on the right when clicking any item:

**Header**
- Issue key (clickable → opens in Jira)
- Type icon + Summary as title
- Status badge (colored by category)
- "Open in Jira" button

**Quick Info Row**
- Assignee (avatar + name)
- Parent (linked to parent item in tree)
- Estimate (if set)
- Created / Updated dates

**Description**
- Rendered markdown/rich text from Jira
- Collapsed if long, with "Show more"

**Acceptance Criteria**
- Pulled out separately if stored in custom field or specific section
- Helps spot "missing details" issues quickly

**Recent Activity**
- Last 5 comments, newest first
- Shows author, timestamp, content preview
- "View all in Jira" link if more exist

**Linked Issues**
- Blockers, blocked by, related items
- Each linked item clickable → loads in same panel

**Behavior**
- Panel stays open as you navigate views
- Clicking another item replaces panel content
- Close via X button or clicking outside

## Configuration

### Environment File (`.env`)

```
JIRA_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=you@yourcompany.com
JIRA_API_TOKEN=your-api-token-here
JIRA_PROJECT_KEYS=PROJ,TEAM,OPS
```

### Configurable Settings

| Setting | Default | Purpose |
|---------|---------|---------|
| `staleDays` | 5 | Days before "In Progress" items flagged as stale |
| `requireEstimates` | true | Flag unestimated stories in Action Required |
| `statusMapping` | auto | Override which statuses map to todo/inprogress/done |
| `initiativeType` | "Initiative" | Issue type name for top-level items |
| `excludeLabels` | [] | Labels to hide from views (e.g., "wontfix") |

### First Run

1. Clone repo
2. Copy `.env.example` to `.env`, fill in credentials
3. Run `npm install && npm start`
4. App opens at `localhost:3000`, fetches data on first load

## Error Handling

### API Errors

- Jira unreachable → Show banner "Cannot connect to Jira" with retry button
- Invalid credentials → Clear message pointing to `.env` setup
- Rate limited → Show warning, auto-retry after delay

### Data Edge Cases

| Situation | Handling |
|-----------|----------|
| Issue missing parent link | Shows at root level in tree, grouped under "Unlinked" |
| Unknown issue type | Treated as "task", displayed with generic icon |
| Circular parent links | Detected and broken, logged to console |
| Very large dataset (1000+ issues) | Paginated fetch, progress indicator during refresh |

### Empty States

- No issues in a kanban column → Show subtle "No items" placeholder
- No action items → Show "All clear!" message
- No results after filtering → "No matches" with clear filters button

### Offline / Stale Data

- If server restarts, cache is empty → First request triggers fresh fetch
- UI shows "Last refreshed: X minutes ago" in footer
- Data persists only in memory (intentionally simple, no database)
