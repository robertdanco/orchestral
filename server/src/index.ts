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
}

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export { app };
