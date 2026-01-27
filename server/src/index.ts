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
import { SlackClient } from './slack/client.js';
import { SlackCache } from './slack/cache.js';
import { SlackMessagesSource } from './chat/sources/slack-messages.js';
import { GoogleClient } from './google/client.js';
import { GoogleDocsCache } from './google/cache.js';
import { GoogleDocsSource } from './chat/sources/google-docs.js';
import { createActionItemsRouter } from './action-items/routes.js';
import { ManualItemsCache } from './action-items/manual-cache.js';
import { JiraSettingsCache } from './action-items/jira-settings-cache.js';

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

  // Initialize Manual Items cache (file-based persistence)
  const manualItemsCache = new ManualItemsCache();
  console.log('Manual Items cache initialized');

  // Initialize Jira Settings cache (file-based persistence)
  const jiraSettingsCache = new JiraSettingsCache();
  console.log('Jira Settings cache initialized');

  // Initialize Slack client and cache if token is provided
  let slackClient: SlackClient | undefined;
  let slackCache: SlackCache | undefined;
  if (process.env.SLACK_BOT_TOKEN) {
    slackClient = new SlackClient({
      botToken: process.env.SLACK_BOT_TOKEN,
      channelIds: (process.env.SLACK_CHANNEL_IDS || '').split(',').filter(Boolean),
    });
    slackCache = new SlackCache();
    console.log('Slack integration initialized');
  }

  // Initialize Google client and cache if credentials are provided
  let googleClient: GoogleClient | undefined;
  let googleDocsCache: GoogleDocsCache | undefined;
  const meetingNotesPattern = process.env.GOOGLE_MEETING_NOTES_PATTERN || 'Meeting Notes.*|Transcript.*';
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
        : undefined;
      googleClient = new GoogleClient({
        serviceAccountKeyPath: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
        serviceAccountKey,
        folderIds: (process.env.GOOGLE_FOLDER_IDS || '').split(',').filter(Boolean),
      });
      googleDocsCache = new GoogleDocsCache();
      console.log('Google Docs integration initialized');
    } catch (error) {
      console.error('Failed to initialize Google Docs integration:', error);
    }
  }

  // Mount Action Items routes
  app.use('/api/action-items', createActionItemsRouter(
    cache,
    confluenceClient,
    confluenceCache,
    manualItemsCache,
    jiraSettingsCache,
    slackClient,
    slackCache,
    googleClient,
    googleDocsCache,
    meetingNotesPattern
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

    // Register Slack messages knowledge source if available
    if (slackClient && slackCache) {
      chatService.registerSource(new SlackMessagesSource(slackClient, slackCache));
    }

    // Register Google Docs knowledge source if available
    if (googleClient && googleDocsCache) {
      chatService.registerSource(new GoogleDocsSource(googleClient, googleDocsCache));
    }

    // Mount chat routes
    app.use('/api/chat', createChatRouter(chatService));
    const sources = ['Jira', 'Confluence'];
    if (slackClient) sources.push('Slack');
    if (googleClient) sources.push('Google Docs');
    console.log(`Chat service initialized with ${sources.join(', ')} knowledge sources`);
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
