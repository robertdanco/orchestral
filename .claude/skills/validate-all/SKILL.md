---
name: validate-all
description: Batch validation - TypeScript + tests in single execution with summarized output
disable-model-invocation: true
---

# Validate All

Run full project validation (TypeScript + tests) with summarized output to reduce context usage.

## Usage

Invoke this skill when you need to validate the entire project after making changes.

## Command

```bash
echo "=== TypeScript ===" && \
server_errors=$(cd server && npx tsc --noEmit --pretty false 2>&1); \
server_count=$(echo "$server_errors" | grep -cE 'error TS' || echo 0); \
if [ "$server_count" -gt 0 ]; then echo "Server: $server_count errors"; echo "$server_errors" | grep -E 'error TS' | head -3; else echo "Server: OK"; fi && \
client_errors=$(cd client && npx tsc --noEmit --pretty false 2>&1); \
client_count=$(echo "$client_errors" | grep -cE 'error TS' || echo 0); \
if [ "$client_count" -gt 0 ]; then echo "Client: $client_count errors"; echo "$client_errors" | grep -E 'error TS' | head -3; else echo "Client: OK"; fi && \
echo "=== Tests ===" && \
test_output=$(npm test 2>&1); \
if echo "$test_output" | grep -qE 'FAIL|failed'; then \
  echo "FAILED"; echo "$test_output" | grep -E 'FAIL|Error:|expected' | head -5; \
else \
  echo "$test_output" | grep -oE '[0-9]+ passed' | tail -2; \
fi
```
