# Jira Visualization Tool Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a local web app that fetches Jira data and displays it as Kanban, Tree, and Action Required views with drill-down detail panels.

**Architecture:** React SPA frontend communicates with Express backend via REST API. Backend holds Jira credentials, fetches from Jira Cloud API, caches in memory. Three views share a common data store and filter state.

**Tech Stack:** React 18, Express 4, TypeScript, Vite, Jest, React Testing Library

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `server/package.json`
- Create: `client/package.json`
- Create: `.env.example`
- Create: `.gitignore`

**Step 1: Create root package.json for monorepo**

```json
{
  "name": "orchestral",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "cd server && npm run dev",
    "dev:client": "cd client && npm run dev",
    "install:all": "npm install && cd server && npm install && cd ../client && npm install",
    "test": "npm run test:server && npm run test:client",
    "test:server": "cd server && npm test",
    "test:client": "cd client && npm test"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

**Step 2: Create server package.json**

```json
{
  "name": "orchestral-server",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "tsx": "^4.6.2",
    "typescript": "^5.3.2",
    "vitest": "^1.1.0"
  }
}
```

**Step 3: Create client package.json**

```json
{
  "name": "orchestral-client",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.6",
    "@testing-library/react": "^14.1.2",
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "jsdom": "^23.0.1",
    "typescript": "^5.3.2",
    "vite": "^5.0.8",
    "vitest": "^1.1.0"
  }
}
```

**Step 4: Create .env.example**

```
JIRA_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=you@yourcompany.com
JIRA_API_TOKEN=your-api-token-here
JIRA_PROJECT_KEYS=PROJ,TEAM
```

**Step 5: Create .gitignore**

```
node_modules/
dist/
.env
*.log
.DS_Store
```

**Step 6: Install dependencies**

Run: `npm install && npm run install:all`
Expected: All packages installed without errors

**Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold monorepo with server and client packages"
```

---

## Task 2: Server TypeScript Configuration

**Files:**
- Create: `server/tsconfig.json`
- Create: `server/src/index.ts`

**Step 1: Create server tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 2: Create minimal server entry point**

```typescript
// server/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export { app };
```

**Step 3: Verify server starts**

Run: `cd server && npm run dev`
Expected: "Server running on http://localhost:3001"

**Step 4: Test health endpoint**

Run: `curl http://localhost:3001/api/health`
Expected: `{"status":"ok"}`

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(server): add Express server with health endpoint"
```

---

## Task 3: Server Test Setup

**Files:**
- Create: `server/vitest.config.ts`
- Create: `server/src/index.test.ts`

**Step 1: Create vitest config**

```typescript
// server/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

**Step 2: Write failing test for health endpoint**

```typescript
// server/src/index.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './index.js';

describe('GET /api/health', () => {
  it('returns ok status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
```

**Step 3: Add supertest dependency**

Run: `cd server && npm install --save-dev supertest @types/supertest`

**Step 4: Run test to verify it passes**

Run: `cd server && npm test`
Expected: 1 test passing

**Step 5: Commit**

```bash
git add -A
git commit -m "test(server): add test setup with health endpoint test"
```

---

## Task 4: JiraItem Type Definition

**Files:**
- Create: `server/src/types.ts`
- Create: `server/src/types.test.ts`

**Step 1: Write test for type validation helper**

```typescript
// server/src/types.test.ts
import { describe, it, expect } from 'vitest';
import { isValidJiraItem, JiraItem } from './types.js';

describe('JiraItem type', () => {
  it('validates a complete JiraItem', () => {
    const item: JiraItem = {
      key: 'PROJ-123',
      summary: 'Test issue',
      type: 'story',
      status: 'In Progress',
      statusCategory: 'inprogress',
      assignee: 'John Doe',
      parentKey: 'PROJ-100',
      estimate: 5,
      created: '2024-01-01T00:00:00Z',
      updated: '2024-01-15T00:00:00Z',
      labels: ['frontend'],
      blocked: false,
      blockedReason: null,
      url: 'https://company.atlassian.net/browse/PROJ-123',
    };
    expect(isValidJiraItem(item)).toBe(true);
  });

  it('validates item with null optional fields', () => {
    const item: JiraItem = {
      key: 'PROJ-124',
      summary: 'Minimal issue',
      type: 'task',
      status: 'To Do',
      statusCategory: 'todo',
      assignee: null,
      parentKey: null,
      estimate: null,
      created: '2024-01-01T00:00:00Z',
      updated: '2024-01-01T00:00:00Z',
      labels: [],
      blocked: false,
      blockedReason: null,
      url: 'https://company.atlassian.net/browse/PROJ-124',
    };
    expect(isValidJiraItem(item)).toBe(true);
  });

  it('rejects item missing required fields', () => {
    const item = { key: 'PROJ-125' };
    expect(isValidJiraItem(item)).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npm test`
Expected: FAIL - module not found

**Step 3: Create types with validation**

```typescript
// server/src/types.ts
export type IssueType = 'initiative' | 'epic' | 'story' | 'task' | 'bug';
export type StatusCategory = 'todo' | 'inprogress' | 'done';

export interface JiraItem {
  key: string;
  summary: string;
  type: IssueType;
  status: string;
  statusCategory: StatusCategory;
  assignee: string | null;
  parentKey: string | null;
  estimate: number | null;
  created: string;
  updated: string;
  labels: string[];
  blocked: boolean;
  blockedReason: string | null;
  url: string;
}

export interface JiraItemDetail extends JiraItem {
  description: string | null;
  acceptanceCriteria: string | null;
  comments: Comment[];
  linkedIssues: LinkedIssue[];
}

export interface Comment {
  id: string;
  author: string;
  body: string;
  created: string;
}

export interface LinkedIssue {
  key: string;
  summary: string;
  type: IssueType;
  linkType: string;
}

export interface HierarchicalJiraItem extends JiraItem {
  children: HierarchicalJiraItem[];
}

const REQUIRED_FIELDS = [
  'key', 'summary', 'type', 'status', 'statusCategory',
  'created', 'updated', 'labels', 'blocked', 'url'
];

export function isValidJiraItem(obj: unknown): obj is JiraItem {
  if (typeof obj !== 'object' || obj === null) return false;
  const record = obj as Record<string, unknown>;
  return REQUIRED_FIELDS.every(field => field in record);
}
```

**Step 4: Run test to verify it passes**

Run: `cd server && npm test`
Expected: All tests passing

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(server): add JiraItem type definitions"
```

---

## Task 5: Jira API Client - Authentication

**Files:**
- Create: `server/src/jira/client.ts`
- Create: `server/src/jira/client.test.ts`

**Step 1: Write test for Jira client configuration**

```typescript
// server/src/jira/client.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JiraClient, JiraClientConfig } from './client.js';

describe('JiraClient', () => {
  const validConfig: JiraClientConfig = {
    baseUrl: 'https://test.atlassian.net',
    email: 'test@example.com',
    apiToken: 'test-token',
    projectKeys: ['PROJ'],
  };

  describe('constructor', () => {
    it('creates client with valid config', () => {
      const client = new JiraClient(validConfig);
      expect(client).toBeDefined();
    });

    it('throws if baseUrl is missing', () => {
      expect(() => new JiraClient({ ...validConfig, baseUrl: '' }))
        .toThrow('JIRA_URL is required');
    });

    it('throws if email is missing', () => {
      expect(() => new JiraClient({ ...validConfig, email: '' }))
        .toThrow('JIRA_EMAIL is required');
    });

    it('throws if apiToken is missing', () => {
      expect(() => new JiraClient({ ...validConfig, apiToken: '' }))
        .toThrow('JIRA_API_TOKEN is required');
    });
  });

  describe('getAuthHeader', () => {
    it('returns correct Basic auth header', () => {
      const client = new JiraClient(validConfig);
      const header = client.getAuthHeader();
      const expected = Buffer.from('test@example.com:test-token').toString('base64');
      expect(header).toBe(`Basic ${expected}`);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npm test`
Expected: FAIL - module not found

**Step 3: Create Jira client**

```typescript
// server/src/jira/client.ts
export interface JiraClientConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKeys: string[];
}

export class JiraClient {
  private baseUrl: string;
  private email: string;
  private apiToken: string;
  private projectKeys: string[];

  constructor(config: JiraClientConfig) {
    if (!config.baseUrl) throw new Error('JIRA_URL is required');
    if (!config.email) throw new Error('JIRA_EMAIL is required');
    if (!config.apiToken) throw new Error('JIRA_API_TOKEN is required');

    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.email = config.email;
    this.apiToken = config.apiToken;
    this.projectKeys = config.projectKeys;
  }

  getAuthHeader(): string {
    const credentials = Buffer.from(`${this.email}:${this.apiToken}`).toString('base64');
    return `Basic ${credentials}`;
  }

  getProjectKeys(): string[] {
    return this.projectKeys;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd server && npm test`
Expected: All tests passing

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(server): add Jira client with auth configuration"
```

---

## Task 6: Jira API Client - Fetch Issues

**Files:**
- Modify: `server/src/jira/client.ts`
- Modify: `server/src/jira/client.test.ts`

**Step 1: Write test for fetchIssues**

Add to `server/src/jira/client.test.ts`:

```typescript
describe('fetchIssues', () => {
  it('calls Jira API with correct JQL and auth', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        issues: [{
          key: 'PROJ-1',
          fields: {
            summary: 'Test issue',
            issuetype: { name: 'Story' },
            status: { name: 'To Do', statusCategory: { key: 'new' } },
            assignee: { displayName: 'John' },
            parent: { key: 'PROJ-100' },
            customfield_10016: 5,
            created: '2024-01-01T00:00:00.000Z',
            updated: '2024-01-15T00:00:00.000Z',
            labels: ['frontend'],
          },
        }],
        total: 1,
      }),
    });

    vi.stubGlobal('fetch', mockFetch);

    const client = new JiraClient(validConfig);
    const issues = await client.fetchIssues();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/rest/api/3/search'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': client.getAuthHeader(),
        }),
      })
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].key).toBe('PROJ-1');

    vi.unstubAllGlobals();
  });

  it('throws on API error', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });

    vi.stubGlobal('fetch', mockFetch);

    const client = new JiraClient(validConfig);
    await expect(client.fetchIssues()).rejects.toThrow('Jira API error: 401');

    vi.unstubAllGlobals();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npm test`
Expected: FAIL - fetchIssues is not a function

**Step 3: Implement fetchIssues**

Add to `server/src/jira/client.ts`:

```typescript
import { JiraItem, IssueType, StatusCategory } from '../types.js';

// Add to JiraClient class:

async fetchIssues(): Promise<JiraItem[]> {
  const jql = `project in (${this.projectKeys.join(',')}) ORDER BY updated DESC`;
  const fields = [
    'summary', 'issuetype', 'status', 'assignee', 'parent',
    'customfield_10016', 'created', 'updated', 'labels',
    'issuelinks', 'priority'
  ].join(',');

  const url = `${this.baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&fields=${fields}&maxResults=1000`;

  const response = await fetch(url, {
    headers: {
      'Authorization': this.getAuthHeader(),
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Jira API error: ${response.status}`);
  }

  const data = await response.json() as JiraSearchResponse;
  return data.issues.map(issue => this.mapIssue(issue));
}

private mapIssue(issue: JiraIssue): JiraItem {
  const blockerLink = issue.fields.issuelinks?.find(
    link => link.type.name === 'Blocks' && link.inwardIssue
  );

  return {
    key: issue.key,
    summary: issue.fields.summary,
    type: this.mapIssueType(issue.fields.issuetype.name),
    status: issue.fields.status.name,
    statusCategory: this.mapStatusCategory(issue.fields.status.statusCategory.key),
    assignee: issue.fields.assignee?.displayName ?? null,
    parentKey: issue.fields.parent?.key ?? null,
    estimate: issue.fields.customfield_10016 ?? null,
    created: issue.fields.created,
    updated: issue.fields.updated,
    labels: issue.fields.labels ?? [],
    blocked: !!blockerLink,
    blockedReason: blockerLink?.inwardIssue?.fields?.summary ?? null,
    url: `${this.baseUrl}/browse/${issue.key}`,
  };
}

private mapIssueType(name: string): IssueType {
  const normalized = name.toLowerCase();
  if (normalized.includes('initiative')) return 'initiative';
  if (normalized.includes('epic')) return 'epic';
  if (normalized.includes('story')) return 'story';
  if (normalized.includes('bug')) return 'bug';
  return 'task';
}

private mapStatusCategory(key: string): StatusCategory {
  if (key === 'new' || key === 'undefined') return 'todo';
  if (key === 'indeterminate') return 'inprogress';
  return 'done';
}

// Add interfaces at top of file after imports:

interface JiraSearchResponse {
  issues: JiraIssue[];
  total: number;
}

interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    issuetype: { name: string };
    status: { name: string; statusCategory: { key: string } };
    assignee: { displayName: string } | null;
    parent: { key: string } | null;
    customfield_10016: number | null;
    created: string;
    updated: string;
    labels: string[];
    issuelinks?: JiraIssueLink[];
  };
}

interface JiraIssueLink {
  type: { name: string };
  inwardIssue?: { key: string; fields?: { summary: string } };
  outwardIssue?: { key: string; fields?: { summary: string } };
}
```

**Step 4: Run test to verify it passes**

Run: `cd server && npm test`
Expected: All tests passing

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(server): add Jira client fetchIssues method"
```

---

## Task 7: In-Memory Cache

**Files:**
- Create: `server/src/cache.ts`
- Create: `server/src/cache.test.ts`

**Step 1: Write test for cache**

```typescript
// server/src/cache.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Cache } from './cache.js';
import { JiraItem } from './types.js';

describe('Cache', () => {
  let cache: Cache;

  const mockItem: JiraItem = {
    key: 'PROJ-1',
    summary: 'Test',
    type: 'story',
    status: 'To Do',
    statusCategory: 'todo',
    assignee: null,
    parentKey: null,
    estimate: null,
    created: '2024-01-01T00:00:00Z',
    updated: '2024-01-01T00:00:00Z',
    labels: [],
    blocked: false,
    blockedReason: null,
    url: 'https://test.atlassian.net/browse/PROJ-1',
  };

  beforeEach(() => {
    cache = new Cache();
  });

  it('starts empty', () => {
    expect(cache.getIssues()).toEqual([]);
    expect(cache.getLastRefreshed()).toBeNull();
  });

  it('stores and retrieves issues', () => {
    cache.setIssues([mockItem]);
    expect(cache.getIssues()).toEqual([mockItem]);
  });

  it('tracks last refreshed time', () => {
    const before = Date.now();
    cache.setIssues([mockItem]);
    const after = Date.now();

    const refreshed = cache.getLastRefreshed();
    expect(refreshed).not.toBeNull();
    expect(refreshed!.getTime()).toBeGreaterThanOrEqual(before);
    expect(refreshed!.getTime()).toBeLessThanOrEqual(after);
  });

  it('clears cache', () => {
    cache.setIssues([mockItem]);
    cache.clear();
    expect(cache.getIssues()).toEqual([]);
    expect(cache.getLastRefreshed()).toBeNull();
  });

  it('gets single issue by key', () => {
    cache.setIssues([mockItem]);
    expect(cache.getIssue('PROJ-1')).toEqual(mockItem);
    expect(cache.getIssue('PROJ-999')).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npm test`
Expected: FAIL - module not found

**Step 3: Implement cache**

```typescript
// server/src/cache.ts
import { JiraItem, JiraItemDetail } from './types.js';

export class Cache {
  private issues: JiraItem[] = [];
  private issueDetails: Map<string, JiraItemDetail> = new Map();
  private lastRefreshed: Date | null = null;

  getIssues(): JiraItem[] {
    return this.issues;
  }

  setIssues(issues: JiraItem[]): void {
    this.issues = issues;
    this.lastRefreshed = new Date();
  }

  getIssue(key: string): JiraItem | undefined {
    return this.issues.find(issue => issue.key === key);
  }

  getIssueDetail(key: string): JiraItemDetail | undefined {
    return this.issueDetails.get(key);
  }

  setIssueDetail(key: string, detail: JiraItemDetail): void {
    this.issueDetails.set(key, detail);
  }

  getLastRefreshed(): Date | null {
    return this.lastRefreshed;
  }

  clear(): void {
    this.issues = [];
    this.issueDetails.clear();
    this.lastRefreshed = null;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd server && npm test`
Expected: All tests passing

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(server): add in-memory cache for Jira issues"
```

---

## Task 8: Hierarchy Builder

**Files:**
- Create: `server/src/hierarchy.ts`
- Create: `server/src/hierarchy.test.ts`

**Step 1: Write test for hierarchy builder**

```typescript
// server/src/hierarchy.test.ts
import { describe, it, expect } from 'vitest';
import { buildHierarchy } from './hierarchy.js';
import { JiraItem, HierarchicalJiraItem } from './types.js';

describe('buildHierarchy', () => {
  const makeItem = (key: string, type: string, parentKey: string | null): JiraItem => ({
    key,
    summary: `Issue ${key}`,
    type: type as JiraItem['type'],
    status: 'To Do',
    statusCategory: 'todo',
    assignee: null,
    parentKey,
    estimate: null,
    created: '2024-01-01T00:00:00Z',
    updated: '2024-01-01T00:00:00Z',
    labels: [],
    blocked: false,
    blockedReason: null,
    url: `https://test.atlassian.net/browse/${key}`,
  });

  it('builds three-level hierarchy', () => {
    const items: JiraItem[] = [
      makeItem('PROJ-1', 'initiative', null),
      makeItem('PROJ-10', 'epic', 'PROJ-1'),
      makeItem('PROJ-100', 'story', 'PROJ-10'),
      makeItem('PROJ-101', 'task', 'PROJ-10'),
    ];

    const result = buildHierarchy(items);

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('PROJ-1');
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].key).toBe('PROJ-10');
    expect(result[0].children[0].children).toHaveLength(2);
  });

  it('puts orphaned items at root level', () => {
    const items: JiraItem[] = [
      makeItem('PROJ-100', 'story', 'PROJ-999'), // parent doesn't exist
    ];

    const result = buildHierarchy(items);

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('PROJ-100');
  });

  it('handles items with no parent', () => {
    const items: JiraItem[] = [
      makeItem('PROJ-1', 'initiative', null),
      makeItem('PROJ-2', 'epic', null),
    ];

    const result = buildHierarchy(items);

    expect(result).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    expect(buildHierarchy([])).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npm test`
Expected: FAIL - module not found

**Step 3: Implement hierarchy builder**

```typescript
// server/src/hierarchy.ts
import { JiraItem, HierarchicalJiraItem } from './types.js';

export function buildHierarchy(items: JiraItem[]): HierarchicalJiraItem[] {
  if (items.length === 0) return [];

  // Create a map for quick lookup
  const itemMap = new Map<string, HierarchicalJiraItem>();

  // Initialize all items with empty children arrays
  for (const item of items) {
    itemMap.set(item.key, { ...item, children: [] });
  }

  const roots: HierarchicalJiraItem[] = [];

  // Build the tree
  for (const item of items) {
    const hierarchicalItem = itemMap.get(item.key)!;

    if (item.parentKey && itemMap.has(item.parentKey)) {
      // Add to parent's children
      const parent = itemMap.get(item.parentKey)!;
      parent.children.push(hierarchicalItem);
    } else {
      // No parent or parent not found - add to roots
      roots.push(hierarchicalItem);
    }
  }

  // Sort children by key for consistent ordering
  const sortChildren = (node: HierarchicalJiraItem): void => {
    node.children.sort((a, b) => a.key.localeCompare(b.key));
    node.children.forEach(sortChildren);
  };

  roots.sort((a, b) => a.key.localeCompare(b.key));
  roots.forEach(sortChildren);

  return roots;
}
```

**Step 4: Run test to verify it passes**

Run: `cd server && npm test`
Expected: All tests passing

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(server): add hierarchy builder for tree view"
```

---

## Task 9: Action Required Detection

**Files:**
- Create: `server/src/actions.ts`
- Create: `server/src/actions.test.ts`

**Step 1: Write test for action detection**

```typescript
// server/src/actions.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { detectActionRequired, ActionRequiredItem, ActionConfig } from './actions.js';
import { JiraItem } from './types.js';

describe('detectActionRequired', () => {
  const config: ActionConfig = {
    staleDays: 5,
    requireEstimates: true,
  };

  const makeItem = (overrides: Partial<JiraItem>): JiraItem => ({
    key: 'PROJ-1',
    summary: 'Test issue',
    type: 'story',
    status: 'In Progress',
    statusCategory: 'inprogress',
    assignee: 'John',
    parentKey: null,
    estimate: 5,
    created: '2024-01-01T00:00:00Z',
    updated: new Date().toISOString(),
    labels: [],
    blocked: false,
    blockedReason: null,
    url: 'https://test.atlassian.net/browse/PROJ-1',
    ...overrides,
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-20T00:00:00Z'));
  });

  it('detects blocked items', () => {
    const items = [makeItem({ blocked: true, blockedReason: 'Waiting on API' })];
    const result = detectActionRequired(items, config);

    expect(result.blocked).toHaveLength(1);
    expect(result.blocked[0].reason).toBe('Waiting on API');
  });

  it('detects stale items', () => {
    const items = [makeItem({ updated: '2024-01-10T00:00:00Z' })]; // 10 days old
    const result = detectActionRequired(items, config);

    expect(result.stale).toHaveLength(1);
    expect(result.stale[0].reason).toContain('10 days');
  });

  it('does not flag recently updated items as stale', () => {
    const items = [makeItem({ updated: '2024-01-18T00:00:00Z' })]; // 2 days old
    const result = detectActionRequired(items, config);

    expect(result.stale).toHaveLength(0);
  });

  it('detects unassigned items', () => {
    const items = [makeItem({ assignee: null })];
    const result = detectActionRequired(items, config);

    expect(result.unassigned).toHaveLength(1);
  });

  it('does not flag done items as unassigned', () => {
    const items = [makeItem({ assignee: null, statusCategory: 'done' })];
    const result = detectActionRequired(items, config);

    expect(result.unassigned).toHaveLength(0);
  });

  it('detects unestimated stories', () => {
    const items = [makeItem({ estimate: null })];
    const result = detectActionRequired(items, config);

    expect(result.unestimated).toHaveLength(1);
  });

  it('does not flag tasks as unestimated', () => {
    const items = [makeItem({ type: 'task', estimate: null })];
    const result = detectActionRequired(items, config);

    expect(result.unestimated).toHaveLength(0);
  });

  vi.useRealTimers();
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npm test`
Expected: FAIL - module not found

**Step 3: Implement action detection**

```typescript
// server/src/actions.ts
import { JiraItem } from './types.js';

export interface ActionConfig {
  staleDays: number;
  requireEstimates: boolean;
}

export interface ActionRequiredItem {
  item: JiraItem;
  reason: string;
}

export interface ActionRequiredResult {
  blocked: ActionRequiredItem[];
  stale: ActionRequiredItem[];
  missingDetails: ActionRequiredItem[];
  unassigned: ActionRequiredItem[];
  unestimated: ActionRequiredItem[];
}

export function detectActionRequired(
  items: JiraItem[],
  config: ActionConfig
): ActionRequiredResult {
  const result: ActionRequiredResult = {
    blocked: [],
    stale: [],
    missingDetails: [],
    unassigned: [],
    unestimated: [],
  };

  const now = new Date();
  const staleThreshold = config.staleDays * 24 * 60 * 60 * 1000;

  for (const item of items) {
    // Skip done items for most checks
    const isDone = item.statusCategory === 'done';

    // Blocked
    if (item.blocked) {
      result.blocked.push({
        item,
        reason: item.blockedReason || 'Marked as blocked',
      });
    }

    // Stale (in progress but not updated recently)
    if (item.statusCategory === 'inprogress') {
      const updatedAt = new Date(item.updated);
      const age = now.getTime() - updatedAt.getTime();
      if (age > staleThreshold) {
        const days = Math.floor(age / (24 * 60 * 60 * 1000));
        result.stale.push({
          item,
          reason: `No updates for ${days} days`,
        });
      }
    }

    // Unassigned (not done, in progress or todo)
    if (!isDone && !item.assignee) {
      result.unassigned.push({
        item,
        reason: 'No assignee',
      });
    }

    // Unestimated (stories only, if enabled)
    if (config.requireEstimates && item.type === 'story' && item.estimate === null) {
      result.unestimated.push({
        item,
        reason: 'Missing story points',
      });
    }
  }

  return result;
}
```

**Step 4: Run test to verify it passes**

Run: `cd server && npm test`
Expected: All tests passing

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(server): add action required detection logic"
```

---

## Task 10: API Routes

**Files:**
- Create: `server/src/routes.ts`
- Create: `server/src/routes.test.ts`
- Modify: `server/src/index.ts`

**Step 1: Write test for API routes**

```typescript
// server/src/routes.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createRouter } from './routes.js';
import { Cache } from './cache.js';
import { JiraClient } from './jira/client.js';

describe('API Routes', () => {
  let app: express.Express;
  let cache: Cache;
  let mockClient: JiraClient;

  const mockItem = {
    key: 'PROJ-1',
    summary: 'Test',
    type: 'story' as const,
    status: 'To Do',
    statusCategory: 'todo' as const,
    assignee: null,
    parentKey: null,
    estimate: null,
    created: '2024-01-01T00:00:00Z',
    updated: '2024-01-01T00:00:00Z',
    labels: [],
    blocked: false,
    blockedReason: null,
    url: 'https://test.atlassian.net/browse/PROJ-1',
  };

  beforeEach(() => {
    cache = new Cache();
    mockClient = {
      fetchIssues: vi.fn().mockResolvedValue([mockItem]),
    } as unknown as JiraClient;

    app = express();
    app.use(express.json());
    app.use('/api', createRouter(cache, mockClient));
  });

  describe('GET /api/issues', () => {
    it('returns cached issues', async () => {
      cache.setIssues([mockItem]);

      const response = await request(app).get('/api/issues');

      expect(response.status).toBe(200);
      expect(response.body.issues).toHaveLength(1);
      expect(response.body.lastRefreshed).toBeDefined();
    });

    it('fetches from Jira if cache is empty', async () => {
      const response = await request(app).get('/api/issues');

      expect(mockClient.fetchIssues).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body.issues).toHaveLength(1);
    });
  });

  describe('POST /api/refresh', () => {
    it('clears cache and fetches fresh data', async () => {
      cache.setIssues([mockItem]);

      const response = await request(app).post('/api/refresh');

      expect(mockClient.fetchIssues).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Refreshed');
    });
  });

  describe('GET /api/issues/:key', () => {
    it('returns single issue', async () => {
      cache.setIssues([mockItem]);

      const response = await request(app).get('/api/issues/PROJ-1');

      expect(response.status).toBe(200);
      expect(response.body.key).toBe('PROJ-1');
    });

    it('returns 404 for unknown issue', async () => {
      cache.setIssues([mockItem]);

      const response = await request(app).get('/api/issues/PROJ-999');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/actions', () => {
    it('returns action required items', async () => {
      cache.setIssues([{ ...mockItem, assignee: null, statusCategory: 'inprogress' }]);

      const response = await request(app).get('/api/actions');

      expect(response.status).toBe(200);
      expect(response.body.unassigned).toHaveLength(1);
    });
  });

  describe('GET /api/hierarchy', () => {
    it('returns hierarchical structure', async () => {
      cache.setIssues([mockItem]);

      const response = await request(app).get('/api/hierarchy');

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npm test`
Expected: FAIL - module not found

**Step 3: Implement routes**

```typescript
// server/src/routes.ts
import { Router } from 'express';
import { Cache } from './cache.js';
import { JiraClient } from './jira/client.js';
import { buildHierarchy } from './hierarchy.js';
import { detectActionRequired, ActionConfig } from './actions.js';

const DEFAULT_ACTION_CONFIG: ActionConfig = {
  staleDays: 5,
  requireEstimates: true,
};

export function createRouter(cache: Cache, client: JiraClient): Router {
  const router = Router();

  // Ensure cache is populated
  async function ensureCache(): Promise<void> {
    if (cache.getIssues().length === 0) {
      const issues = await client.fetchIssues();
      cache.setIssues(issues);
    }
  }

  // GET /api/issues - List all issues
  router.get('/issues', async (_req, res) => {
    try {
      await ensureCache();
      res.json({
        issues: cache.getIssues(),
        lastRefreshed: cache.getLastRefreshed(),
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /api/issues/:key - Single issue
  router.get('/issues/:key', async (req, res) => {
    try {
      await ensureCache();
      const issue = cache.getIssue(req.params.key);
      if (!issue) {
        res.status(404).json({ error: 'Issue not found' });
        return;
      }
      res.json(issue);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // POST /api/refresh - Clear cache and refetch
  router.post('/refresh', async (_req, res) => {
    try {
      cache.clear();
      const issues = await client.fetchIssues();
      cache.setIssues(issues);
      res.json({
        message: 'Refreshed',
        count: issues.length,
        lastRefreshed: cache.getLastRefreshed(),
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /api/hierarchy - Hierarchical tree
  router.get('/hierarchy', async (_req, res) => {
    try {
      await ensureCache();
      const hierarchy = buildHierarchy(cache.getIssues());
      res.json(hierarchy);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /api/actions - Action required items
  router.get('/actions', async (_req, res) => {
    try {
      await ensureCache();
      const actions = detectActionRequired(cache.getIssues(), DEFAULT_ACTION_CONFIG);
      res.json(actions);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /api/config - Public config (no secrets)
  router.get('/config', (_req, res) => {
    res.json({
      projectKeys: client.getProjectKeys(),
      actionConfig: DEFAULT_ACTION_CONFIG,
    });
  });

  return router;
}
```

**Step 4: Update index.ts to use routes**

Replace `server/src/index.ts`:

```typescript
// server/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createRouter } from './routes.js';
import { Cache } from './cache.js';
import { JiraClient } from './jira/client.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Initialize Jira client and cache
const cache = new Cache();
const jiraClient = new JiraClient({
  baseUrl: process.env.JIRA_URL || '',
  email: process.env.JIRA_EMAIL || '',
  apiToken: process.env.JIRA_API_TOKEN || '',
  projectKeys: (process.env.JIRA_PROJECT_KEYS || '').split(',').filter(Boolean),
});

// Mount API routes
app.use('/api', createRouter(cache, jiraClient));

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export { app };
```

**Step 5: Run test to verify it passes**

Run: `cd server && npm test`
Expected: All tests passing

**Step 6: Commit**

```bash
git add -A
git commit -m "feat(server): add API routes for issues, hierarchy, and actions"
```

---

## Task 11: Client Setup with Vite

**Files:**
- Create: `client/vite.config.ts`
- Create: `client/tsconfig.json`
- Create: `client/index.html`
- Create: `client/src/main.tsx`
- Create: `client/src/App.tsx`

**Step 1: Create Vite config**

```typescript
// client/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Step 3: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

**Step 4: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Orchestral - Jira Visualization</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 5: Create main.tsx**

```tsx
// client/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Step 6: Create App.tsx**

```tsx
// client/src/App.tsx
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="nav">
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
            Kanban
          </NavLink>
          <NavLink to="/tree" className={({ isActive }) => isActive ? 'active' : ''}>
            Tree
          </NavLink>
          <NavLink to="/actions" className={({ isActive }) => isActive ? 'active' : ''}>
            Action Required
          </NavLink>
        </nav>
        <main className="main">
          <Routes>
            <Route path="/" element={<div>Kanban View (coming soon)</div>} />
            <Route path="/tree" element={<div>Tree View (coming soon)</div>} />
            <Route path="/actions" element={<div>Action Required (coming soon)</div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
```

**Step 7: Create index.css**

```css
/* client/src/index.css */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
  color: #333;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.nav {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #ddd;
}

.nav a {
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: #666;
  border-radius: 4px;
}

.nav a:hover {
  background: #f0f0f0;
}

.nav a.active {
  background: #0052cc;
  color: white;
}

.main {
  flex: 1;
  padding: 1rem;
}
```

**Step 8: Verify client starts**

Run: `cd client && npm run dev`
Expected: App running at http://localhost:3000

**Step 9: Commit**

```bash
git add -A
git commit -m "feat(client): scaffold React app with Vite and routing"
```

---

## Task 12: Client Test Setup

**Files:**
- Create: `client/vitest.config.ts`
- Create: `client/src/setupTests.ts`
- Create: `client/src/App.test.tsx`

**Step 1: Create vitest config**

```typescript
// client/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
});
```

**Step 2: Create test setup**

```typescript
// client/src/setupTests.ts
import '@testing-library/jest-dom';
```

**Step 3: Write test for App navigation**

```tsx
// client/src/App.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders navigation links', () => {
    render(<App />);

    expect(screen.getByText('Kanban')).toBeInTheDocument();
    expect(screen.getByText('Tree')).toBeInTheDocument();
    expect(screen.getByText('Action Required')).toBeInTheDocument();
  });

  it('shows Kanban view by default', () => {
    render(<App />);

    expect(screen.getByText(/Kanban View/)).toBeInTheDocument();
  });
});
```

**Step 4: Run test to verify it passes**

Run: `cd client && npm test`
Expected: All tests passing

**Step 5: Commit**

```bash
git add -A
git commit -m "test(client): add test setup and App component tests"
```

---

## Task 13: Shared Types and API Client

**Files:**
- Create: `client/src/types.ts`
- Create: `client/src/api.ts`
- Create: `client/src/api.test.ts`

**Step 1: Create shared types**

```typescript
// client/src/types.ts
export type IssueType = 'initiative' | 'epic' | 'story' | 'task' | 'bug';
export type StatusCategory = 'todo' | 'inprogress' | 'done';

export interface JiraItem {
  key: string;
  summary: string;
  type: IssueType;
  status: string;
  statusCategory: StatusCategory;
  assignee: string | null;
  parentKey: string | null;
  estimate: number | null;
  created: string;
  updated: string;
  labels: string[];
  blocked: boolean;
  blockedReason: string | null;
  url: string;
}

export interface HierarchicalJiraItem extends JiraItem {
  children: HierarchicalJiraItem[];
}

export interface ActionRequiredItem {
  item: JiraItem;
  reason: string;
}

export interface ActionRequiredResult {
  blocked: ActionRequiredItem[];
  stale: ActionRequiredItem[];
  missingDetails: ActionRequiredItem[];
  unassigned: ActionRequiredItem[];
  unestimated: ActionRequiredItem[];
}

export interface IssuesResponse {
  issues: JiraItem[];
  lastRefreshed: string | null;
}
```

**Step 2: Write test for API client**

```typescript
// client/src/api.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from './api';

describe('api', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('fetches issues', async () => {
    const mockResponse = {
      issues: [{ key: 'PROJ-1', summary: 'Test' }],
      lastRefreshed: '2024-01-01T00:00:00Z',
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));

    const result = await api.getIssues();

    expect(fetch).toHaveBeenCalledWith('/api/issues');
    expect(result.issues).toHaveLength(1);

    vi.unstubAllGlobals();
  });

  it('throws on error response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));

    await expect(api.getIssues()).rejects.toThrow('API error: 500');

    vi.unstubAllGlobals();
  });
});
```

**Step 3: Implement API client**

```typescript
// client/src/api.ts
import type {
  JiraItem,
  HierarchicalJiraItem,
  ActionRequiredResult,
  IssuesResponse,
} from './types';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

export const api = {
  async getIssues(): Promise<IssuesResponse> {
    return fetchJson('/api/issues');
  },

  async getIssue(key: string): Promise<JiraItem> {
    return fetchJson(`/api/issues/${key}`);
  },

  async getHierarchy(): Promise<HierarchicalJiraItem[]> {
    return fetchJson('/api/hierarchy');
  },

  async getActions(): Promise<ActionRequiredResult> {
    return fetchJson('/api/actions');
  },

  async refresh(): Promise<{ message: string; count: number }> {
    return fetchJson('/api/refresh', { method: 'POST' });
  },
};
```

**Step 4: Run test to verify it passes**

Run: `cd client && npm test`
Expected: All tests passing

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(client): add types and API client"
```

---

## Task 14: Data Hook with Loading/Error States

**Files:**
- Create: `client/src/hooks/useIssues.ts`
- Create: `client/src/hooks/useIssues.test.ts`

**Step 1: Write test for useIssues hook**

```typescript
// client/src/hooks/useIssues.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useIssues } from './useIssues';
import { api } from '../api';

vi.mock('../api');

describe('useIssues', () => {
  const mockIssues = [
    { key: 'PROJ-1', summary: 'Test', type: 'story', statusCategory: 'todo' },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('fetches issues on mount', async () => {
    vi.mocked(api.getIssues).mockResolvedValue({
      issues: mockIssues as any,
      lastRefreshed: '2024-01-01T00:00:00Z',
    });

    const { result } = renderHook(() => useIssues());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.issues).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('handles error', async () => {
    vi.mocked(api.getIssues).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useIssues());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.issues).toEqual([]);
  });

  it('refreshes data', async () => {
    vi.mocked(api.getIssues).mockResolvedValue({
      issues: mockIssues as any,
      lastRefreshed: '2024-01-01T00:00:00Z',
    });
    vi.mocked(api.refresh).mockResolvedValue({ message: 'Refreshed', count: 1 });

    const { result } = renderHook(() => useIssues());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(api.refresh).toHaveBeenCalled();
    expect(api.getIssues).toHaveBeenCalledTimes(2);
  });
});
```

**Step 2: Implement useIssues hook**

```typescript
// client/src/hooks/useIssues.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type { JiraItem } from '../types';

interface UseIssuesResult {
  issues: JiraItem[];
  loading: boolean;
  error: string | null;
  lastRefreshed: Date | null;
  refresh: () => Promise<void>;
}

export function useIssues(): UseIssuesResult {
  const [issues, setIssues] = useState<JiraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getIssues();
      setIssues(response.issues);
      setLastRefreshed(response.lastRefreshed ? new Date(response.lastRefreshed) : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await api.refresh();
      await fetchIssues();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [fetchIssues]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  return { issues, loading, error, lastRefreshed, refresh };
}
```

**Step 3: Run test to verify it passes**

Run: `cd client && npm test`
Expected: All tests passing

**Step 4: Commit**

```bash
git add -A
git commit -m "feat(client): add useIssues hook with loading/error states"
```

---

## Task 15: Issue Card Component

**Files:**
- Create: `client/src/components/IssueCard.tsx`
- Create: `client/src/components/IssueCard.test.tsx`
- Create: `client/src/components/IssueCard.css`

**Step 1: Write test for IssueCard**

```tsx
// client/src/components/IssueCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IssueCard } from './IssueCard';
import type { JiraItem } from '../types';

describe('IssueCard', () => {
  const mockItem: JiraItem = {
    key: 'PROJ-123',
    summary: 'Test issue summary',
    type: 'story',
    status: 'In Progress',
    statusCategory: 'inprogress',
    assignee: 'John Doe',
    parentKey: null,
    estimate: 5,
    created: '2024-01-01T00:00:00Z',
    updated: '2024-01-15T00:00:00Z',
    labels: ['frontend'],
    blocked: false,
    blockedReason: null,
    url: 'https://test.atlassian.net/browse/PROJ-123',
  };

  it('renders issue key and summary', () => {
    render(<IssueCard item={mockItem} onClick={() => {}} />);

    expect(screen.getByText('PROJ-123')).toBeInTheDocument();
    expect(screen.getByText('Test issue summary')).toBeInTheDocument();
  });

  it('shows assignee', () => {
    render(<IssueCard item={mockItem} onClick={() => {}} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('shows type badge', () => {
    render(<IssueCard item={mockItem} onClick={() => {}} />);

    expect(screen.getByText('story')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<IssueCard item={mockItem} onClick={onClick} />);

    fireEvent.click(screen.getByText('PROJ-123'));
    expect(onClick).toHaveBeenCalledWith(mockItem);
  });

  it('shows blocked indicator when blocked', () => {
    const blockedItem = { ...mockItem, blocked: true };
    render(<IssueCard item={blockedItem} onClick={() => {}} />);

    expect(screen.getByText('Blocked')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd client && npm test`
Expected: FAIL - module not found

**Step 3: Implement IssueCard**

```tsx
// client/src/components/IssueCard.tsx
import type { JiraItem } from '../types';
import './IssueCard.css';

interface IssueCardProps {
  item: JiraItem;
  onClick: (item: JiraItem) => void;
}

export function IssueCard({ item, onClick }: IssueCardProps) {
  return (
    <div
      className={`issue-card issue-card--${item.statusCategory}`}
      onClick={() => onClick(item)}
    >
      <div className="issue-card__header">
        <span className={`issue-card__type issue-card__type--${item.type}`}>
          {item.type}
        </span>
        <span className="issue-card__key">{item.key}</span>
        {item.blocked && <span className="issue-card__blocked">Blocked</span>}
      </div>
      <div className="issue-card__summary">{item.summary}</div>
      <div className="issue-card__footer">
        {item.assignee && (
          <span className="issue-card__assignee">{item.assignee}</span>
        )}
        {item.estimate && (
          <span className="issue-card__estimate">{item.estimate}pt</span>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Create styles**

```css
/* client/src/components/IssueCard.css */
.issue-card {
  background: white;
  border-radius: 4px;
  padding: 12px;
  cursor: pointer;
  border-left: 3px solid #ddd;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.issue-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.issue-card--todo {
  border-left-color: #6b778c;
}

.issue-card--inprogress {
  border-left-color: #0052cc;
}

.issue-card--done {
  border-left-color: #36b37e;
}

.issue-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.issue-card__type {
  font-size: 10px;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 3px;
  background: #dfe1e6;
  color: #42526e;
}

.issue-card__type--initiative {
  background: #6554c0;
  color: white;
}

.issue-card__type--epic {
  background: #6554c0;
  color: white;
}

.issue-card__type--story {
  background: #36b37e;
  color: white;
}

.issue-card__type--bug {
  background: #ff5630;
  color: white;
}

.issue-card__key {
  font-size: 12px;
  color: #5e6c84;
}

.issue-card__blocked {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  background: #ff5630;
  color: white;
  margin-left: auto;
}

.issue-card__summary {
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 8px;
}

.issue-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #5e6c84;
}

.issue-card__estimate {
  background: #dfe1e6;
  padding: 2px 6px;
  border-radius: 3px;
}
```

**Step 5: Run test to verify it passes**

Run: `cd client && npm test`
Expected: All tests passing

**Step 6: Commit**

```bash
git add -A
git commit -m "feat(client): add IssueCard component"
```

---

## Task 16: Kanban View

**Files:**
- Create: `client/src/views/KanbanView.tsx`
- Create: `client/src/views/KanbanView.test.tsx`
- Create: `client/src/views/KanbanView.css`

**Step 1: Write test for KanbanView**

```tsx
// client/src/views/KanbanView.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KanbanView } from './KanbanView';
import type { JiraItem } from '../types';

describe('KanbanView', () => {
  const mockIssues: JiraItem[] = [
    {
      key: 'PROJ-1',
      summary: 'Todo item',
      type: 'story',
      status: 'To Do',
      statusCategory: 'todo',
      assignee: null,
      parentKey: null,
      estimate: null,
      created: '2024-01-01T00:00:00Z',
      updated: '2024-01-01T00:00:00Z',
      labels: [],
      blocked: false,
      blockedReason: null,
      url: 'https://test.atlassian.net/browse/PROJ-1',
    },
    {
      key: 'PROJ-2',
      summary: 'In progress item',
      type: 'task',
      status: 'In Progress',
      statusCategory: 'inprogress',
      assignee: 'John',
      parentKey: null,
      estimate: null,
      created: '2024-01-01T00:00:00Z',
      updated: '2024-01-01T00:00:00Z',
      labels: [],
      blocked: false,
      blockedReason: null,
      url: 'https://test.atlassian.net/browse/PROJ-2',
    },
  ];

  it('renders three columns', () => {
    render(<KanbanView issues={mockIssues} onSelectIssue={() => {}} />);

    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('places issues in correct columns', () => {
    render(<KanbanView issues={mockIssues} onSelectIssue={() => {}} />);

    expect(screen.getByText('Todo item')).toBeInTheDocument();
    expect(screen.getByText('In progress item')).toBeInTheDocument();
  });

  it('shows empty state for columns with no issues', () => {
    render(<KanbanView issues={[]} onSelectIssue={() => {}} />);

    expect(screen.getAllByText('No items')).toHaveLength(3);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd client && npm test`
Expected: FAIL - module not found

**Step 3: Implement KanbanView**

```tsx
// client/src/views/KanbanView.tsx
import { useMemo } from 'react';
import { IssueCard } from '../components/IssueCard';
import type { JiraItem, StatusCategory } from '../types';
import './KanbanView.css';

interface KanbanViewProps {
  issues: JiraItem[];
  onSelectIssue: (item: JiraItem) => void;
}

const COLUMNS: { key: StatusCategory; label: string }[] = [
  { key: 'todo', label: 'To Do' },
  { key: 'inprogress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

export function KanbanView({ issues, onSelectIssue }: KanbanViewProps) {
  const columns = useMemo(() => {
    const grouped: Record<StatusCategory, JiraItem[]> = {
      todo: [],
      inprogress: [],
      done: [],
    };

    for (const issue of issues) {
      grouped[issue.statusCategory].push(issue);
    }

    return grouped;
  }, [issues]);

  return (
    <div className="kanban">
      {COLUMNS.map(({ key, label }) => (
        <div key={key} className="kanban__column">
          <div className="kanban__column-header">
            <span className="kanban__column-title">{label}</span>
            <span className="kanban__column-count">{columns[key].length}</span>
          </div>
          <div className="kanban__column-content">
            {columns[key].length === 0 ? (
              <div className="kanban__empty">No items</div>
            ) : (
              columns[key].map(issue => (
                <IssueCard
                  key={issue.key}
                  item={issue}
                  onClick={onSelectIssue}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Step 4: Create styles**

```css
/* client/src/views/KanbanView.css */
.kanban {
  display: flex;
  gap: 16px;
  height: calc(100vh - 100px);
  overflow-x: auto;
}

.kanban__column {
  flex: 1;
  min-width: 280px;
  max-width: 350px;
  display: flex;
  flex-direction: column;
  background: #f4f5f7;
  border-radius: 4px;
}

.kanban__column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #dfe1e6;
}

.kanban__column-title {
  font-weight: 600;
  font-size: 14px;
  color: #172b4d;
}

.kanban__column-count {
  background: #dfe1e6;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  color: #5e6c84;
}

.kanban__column-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kanban__empty {
  text-align: center;
  padding: 24px;
  color: #5e6c84;
  font-size: 14px;
}
```

**Step 5: Run test to verify it passes**

Run: `cd client && npm test`
Expected: All tests passing

**Step 6: Commit**

```bash
git add -A
git commit -m "feat(client): add KanbanView component"
```

---

## Task 17: Tree View

**Files:**
- Create: `client/src/views/TreeView.tsx`
- Create: `client/src/views/TreeView.test.tsx`
- Create: `client/src/views/TreeView.css`
- Create: `client/src/hooks/useHierarchy.ts`

**Step 1: Create useHierarchy hook**

```typescript
// client/src/hooks/useHierarchy.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type { HierarchicalJiraItem } from '../types';

interface UseHierarchyResult {
  hierarchy: HierarchicalJiraItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useHierarchy(): UseHierarchyResult {
  const [hierarchy, setHierarchy] = useState<HierarchicalJiraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHierarchy = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getHierarchy();
      setHierarchy(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setHierarchy([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await api.refresh();
    await fetchHierarchy();
  }, [fetchHierarchy]);

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  return { hierarchy, loading, error, refresh };
}
```

**Step 2: Write test for TreeView**

```tsx
// client/src/views/TreeView.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TreeView } from './TreeView';
import type { HierarchicalJiraItem } from '../types';

describe('TreeView', () => {
  const makeItem = (
    key: string,
    type: string,
    children: HierarchicalJiraItem[] = []
  ): HierarchicalJiraItem => ({
    key,
    summary: `Issue ${key}`,
    type: type as any,
    status: 'To Do',
    statusCategory: 'todo',
    assignee: null,
    parentKey: null,
    estimate: null,
    created: '2024-01-01T00:00:00Z',
    updated: '2024-01-01T00:00:00Z',
    labels: [],
    blocked: false,
    blockedReason: null,
    url: `https://test.atlassian.net/browse/${key}`,
    children,
  });

  const mockHierarchy: HierarchicalJiraItem[] = [
    makeItem('PROJ-1', 'initiative', [
      makeItem('PROJ-10', 'epic', [
        makeItem('PROJ-100', 'story'),
      ]),
    ]),
  ];

  it('renders root items', () => {
    render(<TreeView hierarchy={mockHierarchy} onSelectIssue={() => {}} />);

    expect(screen.getByText('Issue PROJ-1')).toBeInTheDocument();
  });

  it('expands to show children', () => {
    render(<TreeView hierarchy={mockHierarchy} onSelectIssue={() => {}} />);

    // Click to expand
    fireEvent.click(screen.getByText('Issue PROJ-1'));

    expect(screen.getByText('Issue PROJ-10')).toBeInTheDocument();
  });

  it('calls onSelectIssue when clicking issue key', () => {
    const onSelect = vi.fn();
    render(<TreeView hierarchy={mockHierarchy} onSelectIssue={onSelect} />);

    fireEvent.click(screen.getByText('PROJ-1'));

    expect(onSelect).toHaveBeenCalled();
  });
});
```

**Step 3: Run test to verify it fails**

Run: `cd client && npm test`
Expected: FAIL - module not found

**Step 4: Implement TreeView**

```tsx
// client/src/views/TreeView.tsx
import { useState } from 'react';
import type { HierarchicalJiraItem, JiraItem } from '../types';
import './TreeView.css';

interface TreeViewProps {
  hierarchy: HierarchicalJiraItem[];
  onSelectIssue: (item: JiraItem) => void;
}

interface TreeNodeProps {
  item: HierarchicalJiraItem;
  level: number;
  onSelectIssue: (item: JiraItem) => void;
}

function TreeNode({ item, level, onSelectIssue }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(level < 2);
  const hasChildren = item.children.length > 0;

  const doneCount = item.children.filter(c => c.statusCategory === 'done').length;
  const totalCount = item.children.length;

  return (
    <div className="tree-node" style={{ marginLeft: level * 20 }}>
      <div className="tree-node__row">
        {hasChildren && (
          <button
            className="tree-node__toggle"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '▼' : '▶'}
          </button>
        )}
        {!hasChildren && <span className="tree-node__spacer" />}

        <span
          className={`tree-node__type tree-node__type--${item.type}`}
        >
          {item.type.charAt(0).toUpperCase()}
        </span>

        <span
          className="tree-node__key"
          onClick={() => onSelectIssue(item)}
        >
          {item.key}
        </span>

        <span
          className="tree-node__summary"
          onClick={() => setExpanded(!expanded)}
        >
          {item.summary}
        </span>

        <span className={`tree-node__status tree-node__status--${item.statusCategory}`}>
          {item.status}
        </span>

        {hasChildren && (
          <span className="tree-node__progress">
            {doneCount}/{totalCount}
          </span>
        )}

        {item.assignee && (
          <span className="tree-node__assignee">{item.assignee}</span>
        )}
      </div>

      {expanded && hasChildren && (
        <div className="tree-node__children">
          {item.children.map(child => (
            <TreeNode
              key={child.key}
              item={child}
              level={level + 1}
              onSelectIssue={onSelectIssue}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TreeView({ hierarchy, onSelectIssue }: TreeViewProps) {
  if (hierarchy.length === 0) {
    return <div className="tree-empty">No items</div>;
  }

  return (
    <div className="tree-view">
      {hierarchy.map(item => (
        <TreeNode
          key={item.key}
          item={item}
          level={0}
          onSelectIssue={onSelectIssue}
        />
      ))}
    </div>
  );
}
```

**Step 5: Create styles**

```css
/* client/src/views/TreeView.css */
.tree-view {
  padding: 16px;
}

.tree-empty {
  text-align: center;
  padding: 48px;
  color: #5e6c84;
}

.tree-node__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  cursor: default;
}

.tree-node__row:hover {
  background: #f4f5f7;
}

.tree-node__toggle {
  background: none;
  border: none;
  cursor: pointer;
  width: 20px;
  font-size: 10px;
  color: #5e6c84;
}

.tree-node__spacer {
  width: 20px;
}

.tree-node__type {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  color: white;
}

.tree-node__type--initiative {
  background: #6554c0;
}

.tree-node__type--epic {
  background: #6554c0;
}

.tree-node__type--story {
  background: #36b37e;
}

.tree-node__type--task {
  background: #0065ff;
}

.tree-node__type--bug {
  background: #ff5630;
}

.tree-node__key {
  font-size: 12px;
  color: #0052cc;
  cursor: pointer;
}

.tree-node__key:hover {
  text-decoration: underline;
}

.tree-node__summary {
  flex: 1;
  font-size: 14px;
  cursor: pointer;
}

.tree-node__status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 3px;
  background: #dfe1e6;
}

.tree-node__status--todo {
  background: #dfe1e6;
  color: #42526e;
}

.tree-node__status--inprogress {
  background: #deebff;
  color: #0747a6;
}

.tree-node__status--done {
  background: #e3fcef;
  color: #006644;
}

.tree-node__progress {
  font-size: 12px;
  color: #5e6c84;
}

.tree-node__assignee {
  font-size: 12px;
  color: #5e6c84;
  background: #f4f5f7;
  padding: 2px 8px;
  border-radius: 12px;
}

.tree-node__children {
  margin-top: 4px;
}
```

**Step 6: Run test to verify it passes**

Run: `cd client && npm test`
Expected: All tests passing

**Step 7: Commit**

```bash
git add -A
git commit -m "feat(client): add TreeView component with hierarchy display"
```

---

## Task 18: Action Required View

**Files:**
- Create: `client/src/views/ActionsView.tsx`
- Create: `client/src/views/ActionsView.test.tsx`
- Create: `client/src/views/ActionsView.css`
- Create: `client/src/hooks/useActions.ts`

**Step 1: Create useActions hook**

```typescript
// client/src/hooks/useActions.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type { ActionRequiredResult } from '../types';

interface UseActionsResult {
  actions: ActionRequiredResult | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useActions(): UseActionsResult {
  const [actions, setActions] = useState<ActionRequiredResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getActions();
      setActions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setActions(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await api.refresh();
    await fetchActions();
  }, [fetchActions]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  return { actions, loading, error, refresh };
}
```

**Step 2: Write test for ActionsView**

```tsx
// client/src/views/ActionsView.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActionsView } from './ActionsView';
import type { ActionRequiredResult, JiraItem } from '../types';

describe('ActionsView', () => {
  const mockItem: JiraItem = {
    key: 'PROJ-1',
    summary: 'Test issue',
    type: 'story',
    status: 'In Progress',
    statusCategory: 'inprogress',
    assignee: null,
    parentKey: null,
    estimate: null,
    created: '2024-01-01T00:00:00Z',
    updated: '2024-01-01T00:00:00Z',
    labels: [],
    blocked: false,
    blockedReason: null,
    url: 'https://test.atlassian.net/browse/PROJ-1',
  };

  const mockActions: ActionRequiredResult = {
    blocked: [{ item: { ...mockItem, key: 'PROJ-1' }, reason: 'Blocked by API' }],
    stale: [{ item: { ...mockItem, key: 'PROJ-2' }, reason: 'No updates for 10 days' }],
    missingDetails: [],
    unassigned: [{ item: { ...mockItem, key: 'PROJ-3' }, reason: 'No assignee' }],
    unestimated: [],
  };

  it('renders section headers', () => {
    render(<ActionsView actions={mockActions} onSelectIssue={() => {}} />);

    expect(screen.getByText('Blocked')).toBeInTheDocument();
    expect(screen.getByText('Stale')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('shows items with reasons', () => {
    render(<ActionsView actions={mockActions} onSelectIssue={() => {}} />);

    expect(screen.getByText('Blocked by API')).toBeInTheDocument();
    expect(screen.getByText('No updates for 10 days')).toBeInTheDocument();
  });

  it('shows all clear message when no actions', () => {
    const emptyActions: ActionRequiredResult = {
      blocked: [],
      stale: [],
      missingDetails: [],
      unassigned: [],
      unestimated: [],
    };

    render(<ActionsView actions={emptyActions} onSelectIssue={() => {}} />);

    expect(screen.getByText('All clear!')).toBeInTheDocument();
  });
});
```

**Step 3: Run test to verify it fails**

Run: `cd client && npm test`
Expected: FAIL - module not found

**Step 4: Implement ActionsView**

```tsx
// client/src/views/ActionsView.tsx
import type { ActionRequiredResult, ActionRequiredItem, JiraItem } from '../types';
import './ActionsView.css';

interface ActionsViewProps {
  actions: ActionRequiredResult;
  onSelectIssue: (item: JiraItem) => void;
}

interface ActionSectionProps {
  title: string;
  items: ActionRequiredItem[];
  onSelectIssue: (item: JiraItem) => void;
}

function ActionSection({ title, items, onSelectIssue }: ActionSectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="action-section">
      <h3 className="action-section__title">
        {title}
        <span className="action-section__count">{items.length}</span>
      </h3>
      <ul className="action-section__list">
        {items.map(({ item, reason }) => (
          <li key={item.key} className="action-item">
            <span
              className="action-item__key"
              onClick={() => onSelectIssue(item)}
            >
              {item.key}
            </span>
            <span className="action-item__summary">{item.summary}</span>
            <span className="action-item__reason">{reason}</span>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="action-item__link"
            >
              Fix in Jira →
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ActionsView({ actions, onSelectIssue }: ActionsViewProps) {
  const totalCount =
    actions.blocked.length +
    actions.stale.length +
    actions.missingDetails.length +
    actions.unassigned.length +
    actions.unestimated.length;

  if (totalCount === 0) {
    return (
      <div className="actions-empty">
        <div className="actions-empty__icon">✓</div>
        <div className="actions-empty__text">All clear!</div>
        <div className="actions-empty__subtext">No items need attention</div>
      </div>
    );
  }

  return (
    <div className="actions-view">
      <ActionSection
        title="Blocked"
        items={actions.blocked}
        onSelectIssue={onSelectIssue}
      />
      <ActionSection
        title="Stale"
        items={actions.stale}
        onSelectIssue={onSelectIssue}
      />
      <ActionSection
        title="Missing Details"
        items={actions.missingDetails}
        onSelectIssue={onSelectIssue}
      />
      <ActionSection
        title="Unassigned"
        items={actions.unassigned}
        onSelectIssue={onSelectIssue}
      />
      <ActionSection
        title="Unestimated"
        items={actions.unestimated}
        onSelectIssue={onSelectIssue}
      />
    </div>
  );
}
```

**Step 5: Create styles**

```css
/* client/src/views/ActionsView.css */
.actions-view {
  padding: 16px;
  max-width: 900px;
}

.actions-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px;
  text-align: center;
}

.actions-empty__icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #e3fcef;
  color: #006644;
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.actions-empty__text {
  font-size: 24px;
  font-weight: 600;
  color: #172b4d;
}

.actions-empty__subtext {
  font-size: 14px;
  color: #5e6c84;
  margin-top: 8px;
}

.action-section {
  margin-bottom: 24px;
}

.action-section__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #172b4d;
  margin-bottom: 12px;
}

.action-section__count {
  background: #ff5630;
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: normal;
}

.action-section__list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 4px;
  margin-bottom: 8px;
  border-left: 3px solid #ff5630;
}

.action-item__key {
  font-size: 12px;
  color: #0052cc;
  cursor: pointer;
  white-space: nowrap;
}

.action-item__key:hover {
  text-decoration: underline;
}

.action-item__summary {
  flex: 1;
  font-size: 14px;
}

.action-item__reason {
  font-size: 12px;
  color: #5e6c84;
  background: #f4f5f7;
  padding: 4px 8px;
  border-radius: 3px;
}

.action-item__link {
  font-size: 12px;
  color: #0052cc;
  text-decoration: none;
  white-space: nowrap;
}

.action-item__link:hover {
  text-decoration: underline;
}
```

**Step 6: Run test to verify it passes**

Run: `cd client && npm test`
Expected: All tests passing

**Step 7: Commit**

```bash
git add -A
git commit -m "feat(client): add ActionsView for action required items"
```

---

## Task 19: Detail Panel

**Files:**
- Create: `client/src/components/DetailPanel.tsx`
- Create: `client/src/components/DetailPanel.test.tsx`
- Create: `client/src/components/DetailPanel.css`

**Step 1: Write test for DetailPanel**

```tsx
// client/src/components/DetailPanel.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DetailPanel } from './DetailPanel';
import type { JiraItem } from '../types';

describe('DetailPanel', () => {
  const mockItem: JiraItem = {
    key: 'PROJ-123',
    summary: 'Test issue with details',
    type: 'story',
    status: 'In Progress',
    statusCategory: 'inprogress',
    assignee: 'John Doe',
    parentKey: 'PROJ-100',
    estimate: 5,
    created: '2024-01-01T00:00:00Z',
    updated: '2024-01-15T00:00:00Z',
    labels: ['frontend', 'urgent'],
    blocked: false,
    blockedReason: null,
    url: 'https://test.atlassian.net/browse/PROJ-123',
  };

  it('renders nothing when item is null', () => {
    const { container } = render(<DetailPanel item={null} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders issue details', () => {
    render(<DetailPanel item={mockItem} onClose={() => {}} />);

    expect(screen.getByText('PROJ-123')).toBeInTheDocument();
    expect(screen.getByText('Test issue with details')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('shows Open in Jira link', () => {
    render(<DetailPanel item={mockItem} onClose={() => {}} />);

    const link = screen.getByText('Open in Jira');
    expect(link).toHaveAttribute('href', mockItem.url);
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<DetailPanel item={mockItem} onClose={onClose} />);

    fireEvent.click(screen.getByText('×'));
    expect(onClose).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd client && npm test`
Expected: FAIL - module not found

**Step 3: Implement DetailPanel**

```tsx
// client/src/components/DetailPanel.tsx
import type { JiraItem } from '../types';
import './DetailPanel.css';

interface DetailPanelProps {
  item: JiraItem | null;
  onClose: () => void;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function DetailPanel({ item, onClose }: DetailPanelProps) {
  if (!item) return null;

  return (
    <div className="detail-panel">
      <div className="detail-panel__header">
        <div className="detail-panel__title-row">
          <span className={`detail-panel__type detail-panel__type--${item.type}`}>
            {item.type}
          </span>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="detail-panel__key"
          >
            {item.key}
          </a>
          <button className="detail-panel__close" onClick={onClose}>
            ×
          </button>
        </div>
        <h2 className="detail-panel__summary">{item.summary}</h2>
        <span className={`detail-panel__status detail-panel__status--${item.statusCategory}`}>
          {item.status}
        </span>
      </div>

      <div className="detail-panel__body">
        <div className="detail-panel__section">
          <div className="detail-panel__field">
            <span className="detail-panel__label">Assignee</span>
            <span className="detail-panel__value">
              {item.assignee || 'Unassigned'}
            </span>
          </div>

          {item.parentKey && (
            <div className="detail-panel__field">
              <span className="detail-panel__label">Parent</span>
              <span className="detail-panel__value">{item.parentKey}</span>
            </div>
          )}

          {item.estimate && (
            <div className="detail-panel__field">
              <span className="detail-panel__label">Estimate</span>
              <span className="detail-panel__value">{item.estimate} points</span>
            </div>
          )}

          <div className="detail-panel__field">
            <span className="detail-panel__label">Created</span>
            <span className="detail-panel__value">{formatDate(item.created)}</span>
          </div>

          <div className="detail-panel__field">
            <span className="detail-panel__label">Updated</span>
            <span className="detail-panel__value">{formatDate(item.updated)}</span>
          </div>

          {item.labels.length > 0 && (
            <div className="detail-panel__field">
              <span className="detail-panel__label">Labels</span>
              <div className="detail-panel__labels">
                {item.labels.map(label => (
                  <span key={label} className="detail-panel__label-tag">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.blocked && (
            <div className="detail-panel__blocked">
              <strong>Blocked:</strong> {item.blockedReason || 'No reason provided'}
            </div>
          )}
        </div>

        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="detail-panel__jira-link"
        >
          Open in Jira
        </a>
      </div>
    </div>
  );
}
```

**Step 4: Create styles**

```css
/* client/src/components/DetailPanel.css */
.detail-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  background: white;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 100;
}

.detail-panel__header {
  padding: 20px;
  border-bottom: 1px solid #dfe1e6;
}

.detail-panel__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.detail-panel__type {
  font-size: 11px;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 3px;
  color: white;
}

.detail-panel__type--initiative,
.detail-panel__type--epic {
  background: #6554c0;
}

.detail-panel__type--story {
  background: #36b37e;
}

.detail-panel__type--task {
  background: #0065ff;
}

.detail-panel__type--bug {
  background: #ff5630;
}

.detail-panel__key {
  font-size: 14px;
  color: #0052cc;
  text-decoration: none;
}

.detail-panel__key:hover {
  text-decoration: underline;
}

.detail-panel__close {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 24px;
  color: #5e6c84;
  cursor: pointer;
  padding: 0 8px;
}

.detail-panel__close:hover {
  color: #172b4d;
}

.detail-panel__summary {
  font-size: 18px;
  font-weight: 600;
  color: #172b4d;
  margin: 0 0 12px 0;
}

.detail-panel__status {
  display: inline-block;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 3px;
}

.detail-panel__status--todo {
  background: #dfe1e6;
  color: #42526e;
}

.detail-panel__status--inprogress {
  background: #deebff;
  color: #0747a6;
}

.detail-panel__status--done {
  background: #e3fcef;
  color: #006644;
}

.detail-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.detail-panel__section {
  margin-bottom: 24px;
}

.detail-panel__field {
  margin-bottom: 16px;
}

.detail-panel__label {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  color: #5e6c84;
  margin-bottom: 4px;
}

.detail-panel__value {
  font-size: 14px;
  color: #172b4d;
}

.detail-panel__labels {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.detail-panel__label-tag {
  font-size: 12px;
  padding: 2px 8px;
  background: #f4f5f7;
  border-radius: 3px;
  color: #42526e;
}

.detail-panel__blocked {
  padding: 12px;
  background: #ffebe6;
  border-radius: 4px;
  color: #de350b;
  font-size: 14px;
}

.detail-panel__jira-link {
  display: block;
  text-align: center;
  padding: 12px;
  background: #0052cc;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
}

.detail-panel__jira-link:hover {
  background: #0747a6;
}
```

**Step 5: Run test to verify it passes**

Run: `cd client && npm test`
Expected: All tests passing

**Step 6: Commit**

```bash
git add -A
git commit -m "feat(client): add DetailPanel component"
```

---

## Task 20: Wire Up App with All Views

**Files:**
- Modify: `client/src/App.tsx`
- Modify: `client/src/App.test.tsx`
- Create: `client/src/components/Header.tsx`
- Create: `client/src/components/Header.css`

**Step 1: Create Header component**

```tsx
// client/src/components/Header.tsx
import './Header.css';

interface HeaderProps {
  lastRefreshed: Date | null;
  loading: boolean;
  onRefresh: () => void;
}

export function Header({ lastRefreshed, loading, onRefresh }: HeaderProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <header className="header">
      <h1 className="header__title">Orchestral</h1>
      <div className="header__actions">
        {lastRefreshed && (
          <span className="header__refreshed">
            Last refreshed: {formatTime(lastRefreshed)}
          </span>
        )}
        <button
          className="header__refresh-btn"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </header>
  );
}
```

**Step 2: Create Header styles**

```css
/* client/src/components/Header.css */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #dfe1e6;
}

.header__title {
  font-size: 20px;
  font-weight: 600;
  color: #172b4d;
  margin: 0;
}

.header__actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header__refreshed {
  font-size: 12px;
  color: #5e6c84;
}

.header__refresh-btn {
  padding: 8px 16px;
  background: #0052cc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.header__refresh-btn:hover:not(:disabled) {
  background: #0747a6;
}

.header__refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

**Step 3: Update App.tsx with full implementation**

```tsx
// client/src/App.tsx
import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Header } from './components/Header';
import { DetailPanel } from './components/DetailPanel';
import { KanbanView } from './views/KanbanView';
import { TreeView } from './views/TreeView';
import { ActionsView } from './views/ActionsView';
import { useIssues } from './hooks/useIssues';
import { useHierarchy } from './hooks/useHierarchy';
import { useActions } from './hooks/useActions';
import type { JiraItem } from './types';
import './index.css';

function AppContent() {
  const [selectedItem, setSelectedItem] = useState<JiraItem | null>(null);

  const {
    issues,
    loading: issuesLoading,
    error: issuesError,
    lastRefreshed,
    refresh: refreshIssues,
  } = useIssues();

  const {
    hierarchy,
    loading: hierarchyLoading,
    refresh: refreshHierarchy,
  } = useHierarchy();

  const {
    actions,
    loading: actionsLoading,
    refresh: refreshActions,
  } = useActions();

  const loading = issuesLoading || hierarchyLoading || actionsLoading;

  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshIssues(), refreshHierarchy(), refreshActions()]);
  }, [refreshIssues, refreshHierarchy, refreshActions]);

  const handleSelectIssue = useCallback((item: JiraItem) => {
    setSelectedItem(item);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedItem(null);
  }, []);

  if (issuesError) {
    return (
      <div className="error">
        <h2>Error loading data</h2>
        <p>{issuesError}</p>
        <button onClick={handleRefresh}>Retry</button>
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        lastRefreshed={lastRefreshed}
        loading={loading}
        onRefresh={handleRefresh}
      />
      <nav className="nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} end>
          Kanban
        </NavLink>
        <NavLink to="/tree" className={({ isActive }) => isActive ? 'active' : ''}>
          Tree
        </NavLink>
        <NavLink to="/actions" className={({ isActive }) => isActive ? 'active' : ''}>
          Action Required
        </NavLink>
      </nav>
      <main className={`main ${selectedItem ? 'main--with-panel' : ''}`}>
        <Routes>
          <Route
            path="/"
            element={
              <KanbanView issues={issues} onSelectIssue={handleSelectIssue} />
            }
          />
          <Route
            path="/tree"
            element={
              <TreeView hierarchy={hierarchy} onSelectIssue={handleSelectIssue} />
            }
          />
          <Route
            path="/actions"
            element={
              actions ? (
                <ActionsView actions={actions} onSelectIssue={handleSelectIssue} />
              ) : (
                <div>Loading...</div>
              )
            }
          />
        </Routes>
      </main>
      <DetailPanel item={selectedItem} onClose={handleClosePanel} />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
```

**Step 4: Update index.css with additional styles**

Add to `client/src/index.css`:

```css
.main--with-panel {
  margin-right: 400px;
}

.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
}

.error h2 {
  color: #de350b;
}

.error button {
  margin-top: 16px;
  padding: 8px 16px;
  background: #0052cc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
```

**Step 5: Update App test**

```tsx
// client/src/App.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { api } from './api';

vi.mock('./api');

describe('App', () => {
  beforeEach(() => {
    vi.mocked(api.getIssues).mockResolvedValue({
      issues: [],
      lastRefreshed: new Date().toISOString(),
    });
    vi.mocked(api.getHierarchy).mockResolvedValue([]);
    vi.mocked(api.getActions).mockResolvedValue({
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
```

**Step 6: Run all tests**

Run: `npm test`
Expected: All tests passing

**Step 7: Commit**

```bash
git add -A
git commit -m "feat(client): wire up all views with shared state and detail panel"
```

---

## Task 21: Final Integration Test

**Step 1: Create .env file (not committed)**

Copy `.env.example` to `.env` and fill in your Jira credentials.

**Step 2: Start the application**

Run: `npm run dev`
Expected: Both server (3001) and client (3000) start

**Step 3: Verify in browser**

1. Open http://localhost:3000
2. Verify Kanban view loads with issues from Jira
3. Click Tree tab, verify hierarchy displays
4. Click Action Required tab, verify issues needing attention show
5. Click an issue, verify detail panel opens
6. Click "Open in Jira", verify it opens the correct issue
7. Click Refresh, verify data updates

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: complete integration and testing"
```

---

## Summary

This plan creates a complete Jira visualization tool with:

- **Server**: Express API with Jira Cloud integration, in-memory caching, hierarchy building, and action detection
- **Client**: React SPA with Kanban, Tree, and Action Required views plus detail panel
- **Testing**: Comprehensive tests for all components and logic

All 21 tasks follow TDD principles with bite-sized steps.
