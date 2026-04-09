# CLAUDE.md
# Zubia Pulse Desktop
# Permanent rules, never delete, only add.
# Every rule here was learned from a real mistake.

## Core Rules
- No em dashes ever in any output
- All Ollama calls via invoke() only
- Never fetch() to localhost:11434
- Never upgrade Tailwind to v4
- Never use integer IDs, TEXT UUID only
- Never git add ., specific files only
- Always end with npx tsc --noEmit
- Always push to dev branch only
- Always report commit hash only
- Never touch migrations 1-30
- Human approval gate on every output
- Business logic in services/ only
- invoke() uses camelCase keys from TS

## Rules added 2026-04-09
- OAuth Web application client type only
  Desktop client does not support redirect URIs
- google_auth_listen must start BEFORE
  google_auth_start. Listen first, browser second
- tailwind.config.js content path must be
  ./src/**/*.{ts,tsx}, never empty array
- Always PRAGMA table_info before ALTER TABLE
  List existing columns in migration comment
- Always query schema_migrations before
  assigning any new migration version number
