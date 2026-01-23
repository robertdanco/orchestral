import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRouter } from './routes.js';
import { Cache } from './cache.js';
import { JiraClient } from './jira/client.js';
import { createChatRouter } from './chat/routes.js';
import { ChatService } from './chat/service.js';
import { createLLMClient } from './chat/llm/client.js';
import { JiraIssuesSource } from './chat/sources/jira-issues.js';
import { ConfluenceClient } from './confluence/client.js';
import { ConfluenceCache } from './confluence/cache.js';
import { createConfluenceRouter } from './confluence-routes.js';
import { ConfluencePagesSource } from './chat/sources/confluence-pages.js';
import { createActionItemsRouter } from './action-items/routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Initialize Jira client and cache only if credentials are provided
if (process.env.JIRA_URL && process.env.JIRA_EMAIL && process.env.JIRA_API_TOKEN) {
  const cache = new Cache();
  const jiraClient = new JiraClient({
    baseUrl: process.env.JIRA_URL,
    email: process.env.JIRA_EMAIL,
    apiToken: process.env.JIRA_API_TOKEN,
    projectKeys: (process.env.JIRA_PROJECT_KEYS || '').split(',').filter(Boolean),
  });

  // Mount API routes
  app.use('/api', createRouter(cache, jiraClient));

  // Initialize Confluence client and cache (uses same Atlassian credentials)
  const confluenceCache = new ConfluenceCache();
  const confluenceClient = new ConfluenceClient({
    baseUrl: process.env.JIRA_URL,
    email: process.env.JIRA_EMAIL,
    apiToken: process.env.JIRA_API_TOKEN,
    spaceKeys: (process.env.CONFLUENCE_SPACE_KEYS || '').split(',').filter(Boolean),
  });

  // Mount Confluence routes
  app.use('/api/confluence', createConfluenceRouter(confluenceCache, confluenceClient));
  console.log('Confluence integration initialized');

  // Mount Action Items routes
  app.use('/api/action-items', createActionItemsRouter(
    cache,
    confluenceClient,
    confluenceCache,
    process.env.JIRA_EMAIL
  ));
  console.log('Action Items integration initialized');

  // Initialize chat service if Anthropic API key is available
  if (process.env.ANTHROPIC_API_KEY) {
    const llmClient = createLLMClient();
    const chatService = new ChatService({ llmClient });

    // Register Jira issues knowledge source
    chatService.registerSource(new JiraIssuesSource(cache));

    // Register Confluence pages knowledge source
    chatService.registerSource(new ConfluencePagesSource(confluenceCache, confluenceClient));

    // Mount chat routes
    app.use('/api/chat', createChatRouter(chatService));
    console.log('Chat service initialized with Jira and Confluence knowledge sources');
  } else {
    console.log('ANTHROPIC_API_KEY not set - chat feature disabled');
  }
}

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export { app };
