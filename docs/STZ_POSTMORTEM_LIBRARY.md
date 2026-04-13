# STZ Postmortem Library
# Zubia Pulse Desktop
# Every bug ever found and fixed.
# Never delete. Only add.
# Format: INC-XXX | Date | What broke |
#   Root cause | Fix | Prevention | Commit

## How to use this file
At the end of every session paste the
END OF SESSION prompt into Cursor.
It will extract and add new incidents.

---

## INC-001
Date: 2026-04-07
What broke: Migration UNIQUE constraint
  failed on app startup repeatedly
Root cause: Multiple fix attempts added
  duplicate version numbers to both
  the TypeScript migrations array and
  the schema_migrations table in SQLite
Fix applied: Deleted duplicate rows from
  schema_migrations table directly using
  sqlite3 CLI DELETE command
Prevention rule: Always query
  schema_migrations table BEFORE writing
  any new migration version number.
  Never assign a version number without
  confirming it is not already in the DB.
Commit: 4769ab1

## INC-002
Date: 2026-04-07
What broke: Gmail and Calendar sync
  failed with missing required key
  accessToken error
Root cause: invoke() calls used
  snake_case keys (access_token)
  but Tauri 2 requires camelCase
  (accessToken) on TypeScript side
Fix applied: Updated all invoke() calls
  in googleService.ts to use camelCase
  parameter keys
Prevention rule: Always use camelCase
  in invoke() calls. Rust snake_case
  parameters are converted automatically.
Commit: f2a3252

## INC-003
Date: 2026-04-07
What broke: OAuth connection failed
  because auth code was lost before
  callback server was listening
Root cause: google_auth_start (opens
  browser) was called before
  google_auth_listen (starts server)
  so the redirect hit a closed port
Fix applied: Reordered handleConnect()
  to start listen promise first,
  then open browser, then await promise
Prevention rule: Always initialize the
  callback listener before triggering
  any redirect that will call it
Commit: 0ba719a

## INC-004
Date: 2026-04-07
What broke: contacts table ALTER TABLE
  failed with duplicate column name
  pipeline_stage on app startup
Root cause: Migration 22 tried to add
  columns that were already present
  from a previous session's migration
  attempt that partially succeeded
Fix applied: Audited all existing
  contacts columns via PRAGMA table_info
  and removed duplicate ALTER TABLE
  statements from migration 22
Prevention rule: Always run
  PRAGMA table_info(table_name) before
  writing any ALTER TABLE migration.
  List existing columns explicitly in
  migration comments.
Commit: 4c4096c

## INC-005
Date: 2026-04-07
What broke: DrRajDemo showed unstyled
  plain HTML because Tailwind content
  path was empty array
Root cause: tailwind.config.js had
  content: [] so Tailwind never
  scanned src/ files for class names
Fix applied: Changed content to
  ["./src/**/*.{ts,tsx}"] and rewrote
  DrRajDemo using inline styles matching
  the app design system
Prevention rule: Always verify
  tailwind.config.js content path
  includes src/**/*.{ts,tsx} before
  building any new module
Commit: 5ad79a4

## INC-006
Date: 2026-04-09
What broke: Job queue stopped processing;
  jobs stuck in running forever
Root cause: Poller returned immediately if
  any row had status running, so a stuck run
  never cleared and pending work starved
Fix applied: If running job started_at is
  older than 600 seconds, mark it failed
  with Timed out after 600s, then continue
Prevention rule: Never rely on a bare
  running check without a timeout path
Commit: d146c14

## INC-007
Date: 2026-04-09
What broke: Ollama connection or generation
  failed on long pasted transcripts
Root cause: num_ctx too small for combined
  system, user, and transcript tokens
Fix applied: Increased num_ctx to 32768 in
  ollama.rs options for ollama_generate
Prevention rule: Do not assume default
  context fits long transcript ingestion
Commit: 1acde50

## INC-008
Date: 2026-04-09
What broke: Long-running Ollama calls aborted
  before completion
Root cause: reqwest client timeout was 120s
Fix applied: Increased client timeout to 600s
Prevention rule: Keep LLM timeouts aligned
  with worst-case transcript and brief length
Commit: 1c5d6b9

## INC-009
Date: 2026-04-09
What broke: BNI pitch output too long and
  generic; weak memory hook
Root cause: Prompt allowed flexible structure
  without hard word cap or exact closing lines
Fix applied: Migration 36 (prompt v2) with
  150-word max, exact memory hook, sign-off,
  and referral trigger text
Prevention rule: Treat BNI pitch as a
  constrained performance script, not a essay
Commit: 84905ed

## INC-010
Date: 2026-04-09
What broke: Jobs existed in prompts table
  but did not appear in Run a Job UI
Root cause: jobs_menu had no rows for those
  job_id values; UI lists from jobs_menu
Fix applied: Migration 35 seeded bni_pitch_generator,
  blog_post_generator, testimonial_request
Prevention rule: Always pair prompt seeds with
  jobs_menu seeds for operator-visible jobs
Commit: f191987

## INC-011
Date: 2026-04-09
What broke: Port 1420 already in use on
  dev restart; app would not bind
Root cause: node.exe from prior Vite or
  Tauri dev session still held the port
Fix applied: taskkill /F /IM node.exe before
  restarting npm run tauri dev
Prevention rule: Kill node.exe, not only
  zubia-pulse.exe, when freeing dev ports
Commit: n/a (operational)

## INC-012
Date: 2026-04-09
What broke: Client card overlay covered the
  full page and hid the contact list
Root cause: Modal or overlay layout for
  detail view instead of persistent list context
Fix applied: Inline split panel: list left,
  card right, no full-page overlay
Prevention rule: Keep pipeline list visible
  while editing a single contact
Commit: bdc189b

## INC-013
Date: 2026-04-13
What broke: Init error UNIQUE constraint
  on schema_migrations repeatedly
Root cause: Migration version numbers
  in code did not match what was
  already applied in database
Fix applied: Query schema_migrations
  first, delete duplicate rows via
  sqlite3, renumber migrations
Prevention rule: Always run sqlite3
  SELECT version FROM schema_migrations
  before assigning any new version
Commit: session 2026-04-13

## INC-014
Date: 2026-04-13
What broke: proposal_gen job failed
  with no active prompt error
Root cause: Old job_id proposal_gen
  had no matching prompt in prompts table
Fix applied: Deactivated old job via
  sqlite3 UPDATE jobs_menu SET active=0
Prevention rule: Always check both
  jobs_menu and prompts table for
  orphaned job_ids before adding new jobs
Commit: session 2026-04-13

## INC-015
Date: 2026-04-13
What broke: invoke() parameter mismatch
  in Google sync -- accessToken vs
  access_token
Root cause: Tauri 2 requires camelCase
  in TypeScript invoke() calls
Fix applied: Updated all invoke params
  to camelCase in googleService.ts
Prevention rule: Always use camelCase
  in invoke() -- Tauri converts to
  snake_case for Rust automatically
Commit: session 2026-04-13

