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

## Rules added 2026-04-09 (session capture)

- ollama_generate command lives in
  src-tauri/src/ollama.rs not main.rs
  or lib.rs. Always check ollama.rs
  for num_ctx and timeout settings.

- fetch() is allowed for RSS feeds and
  external HTTP APIs. Only blocked for
  localhost Ollama calls which must use
  invoke().

- Job queue deadlock prevention: poller
  must timeout stuck running jobs after
  600 seconds and mark them failed before
  processing next pending job.

- Always kill node.exe when restarting
  the app. taskkill zubia-pulse.exe alone
  does not free port 1420.

- Jobs menu entries and prompt entries
  must both be seeded for a job to appear
  in Run a Job. Seeding prompts without
  jobs_menu entry makes the job invisible.

- BNI pitch outputs must be under 150
  words. Any prompt generating BNI
  content must enforce strict word count
  and require exact memory hook wording.

- Client card UI must use split panel
  layout not overlay. Contact list stays
  visible on left. Card opens on right.
  No fixed position overlays on any
  detail views.
