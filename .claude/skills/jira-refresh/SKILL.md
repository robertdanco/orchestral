---
name: jira-refresh
description: Refresh Jira data and show cache status
disable-model-invocation: true
---

# Jira Refresh

Trigger a refresh of Jira data and display results.

## Steps
1. Ensure server is running on port 3001
2. Call POST /api/refresh
3. Display count and last refreshed timestamp

```bash
curl -s -X POST http://localhost:3001/api/refresh | jq .
```
