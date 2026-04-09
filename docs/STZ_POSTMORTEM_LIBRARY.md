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

