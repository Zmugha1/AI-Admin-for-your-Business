# STZ Architecture Decision Record Log
# Zubia Pulse Desktop
# Every architecture decision ever made.
# Never delete. Only add.
# Format: ADR-XXX | Date | Decision |
#   Layer | Context | Consequence | Never do

## How to use this file
At the end of every session paste the
END OF SESSION prompt into Cursor.
It will extract and add new ADRs automatically.

---

## ADR-001
Date: 2026-04-07
Decision: All Ollama calls from TypeScript
  must use invoke() never fetch()
Layer: Tech
Context: Tauri CSP blocks direct fetch()
  to localhost:11434
Consequence: Every LLM call goes through
  Rust proxy command ollama_generate
Never do: fetch('http://localhost:11434/...')
  from any TypeScript file ever

## ADR-002
Date: 2026-04-07
Decision: Tailwind CSS pinned to v3
  Never upgrade to v4
Layer: Tech
Context: v4 breaks existing class usage
  and has different configuration
Consequence: All components use v3 classes
  and inline styles for brand colors
Never do: npm install tailwindcss@latest
  or upgrade tailwind in package.json

## ADR-003
Date: 2026-04-07
Decision: All IDs are TEXT UUID
  Never integers
Layer: Tech
Context: SQLite integer IDs create
  cross-table conflicts and are not
  portable across installs
Consequence: Every table primary key
  uses TEXT and uuidv4() on insert
Never do: Use INTEGER PRIMARY KEY
  AUTOINCREMENT on any table

## ADR-004
Date: 2026-04-07
Decision: Business logic in services/ only
  Never in modules/ or components/
Layer: Tech
Context: Mixing business logic into
  UI components creates untestable
  and unmaintainable code
Consequence: All database operations,
  calculations, and API calls live
  in src/services/ only
Never do: Write db.execute() calls
  directly inside a React component

## ADR-005
Date: 2026-04-07
Decision: Never touch existing migrations
  New migrations get next version number
Layer: Tech
Context: Existing migrations have been
  applied to production database.
  Changing them breaks the DB state.
Consequence: Always check
  schema_migrations table before
  assigning a new version number
Never do: Edit any migration that has
  already been applied to the database

## ADR-006
Date: 2026-04-07
Decision: OAuth redirect URI must be
  http://localhost:8765/callback
  Web application client type only
  Desktop client type does not support
  custom redirect URIs
Layer: Tech
Context: Google OAuth Desktop clients
  do not have Authorized redirect URIs
  section. Web application clients do.
Consequence: Always create Web application
  OAuth client in Google Cloud Console
  for Tauri desktop apps using localhost
  callback server
Never do: Use Desktop app OAuth client
  type when a redirect URI is needed

## ADR-007
Date: 2026-04-07
Decision: Tauri 2 invoke() uses camelCase
  parameter keys from TypeScript side
  Rust command parameters use snake_case
  Tauri handles the conversion automatically
Layer: Tech
Context: invoke('command', { access_token })
  fails silently. Must use accessToken.
Consequence: All invoke() calls use
  camelCase keys. Rust functions use
  snake_case parameters. Never mix.
Never do: Use snake_case keys in any
  invoke() call from TypeScript

## ADR-008
Date: 2026-04-07
Decision: No em dashes in any output
  ever — use commas or periods instead
Layer: L1 Voice
Context: Em dashes are the most recognizable
  signal of AI-generated writing.
  Sounding like AI is the primary
  reputational failure mode.
Consequence: Every prompt template,
  every generated output, every UI label
  must be checked for em dashes before
  shipping
Never do: Use — in any output, prompt,
  UI text, or generated content

## ADR-009
Date: 2026-04-07
Decision: Google OAuth callback server
  must start listening BEFORE opening
  the browser
Layer: Tech
Context: If browser opens before server
  listens on 8765, the redirect hits
  a closed port and the auth code is lost
Consequence: In handleConnect():
  start listen promise first,
  then open browser,
  then await the listen promise
Never do: Call google_auth_start before
  google_auth_listen is initialized

## ADR-010
Date: 2026-04-07
Decision: Migration version conflicts
  must be resolved by cleaning the
  schema_migrations table directly
  using sqlite3 CLI, not by changing
  the TypeScript migration code
Layer: Tech
Context: When duplicate versions exist
  in schema_migrations table the app
  throws UNIQUE constraint failed on
  startup. The fix is to delete the
  duplicate rows from the database
  directly.
Consequence: Always run sqlite3 PRAGMA
  query to check current DB state
  before debugging migration code
Never do: Change migration version numbers
  without first checking what versions
  are already in the database

## ADR-011
Date: 2026-04-09
Decision: Client card opens as inline split
  panel, not a full-page overlay
Layer: Tech
Context: Overlay covered the contact list
  and broke scanability of the pipeline
Consequence: Contact list stays visible on
  the left; the card opens on the right
Never do: Use fixed-position full-page
  overlays for client detail views

## ADR-012
Date: 2026-04-09
Decision: Ollama context window (num_ctx)
  set to 32768 for long transcript processing
Layer: Tech
Context: Default context was too small for
  large pasted transcripts in Pre-Meeting Brief
Consequence: Rust ollama_generate request body
  uses num_ctx 32768 in ollama.rs
Never do: Shrink num_ctx below what long
  transcript flows need without measuring

## ADR-013
Date: 2026-04-09
Decision: Ollama HTTP client timeout increased
  to 600 seconds (10 minutes)
Layer: Tech
Context: Two-minute timeout aborted long
  generations before the model finished
Consequence: reqwest client in ollama.rs uses
  Duration::from_secs(600)
Never do: Use a sub-600s timeout for flows
  that may process long transcripts or briefs

## ADR-014
Date: 2026-04-09
Decision: Job queue poller must recover from
  stuck running jobs by timing them out after
  600 seconds, then continue processing
Layer: Tech
Context: Any row left in running forever
  deadlocked the entire queue
Consequence: processNextJob marks stale
  running rows failed, then picks pending work
Never do: Return early on any running job
  without a started_at timeout check

## ADR-015
Date: 2026-04-09
Decision: ollama_generate is implemented in
  src-tauri/src/ollama.rs, not main.rs or lib.rs
Layer: Tech
Context: lib.rs only registers commands;
  HTTP options and model live in the ollama module
Consequence: All num_ctx, num_predict, timeout,
  and model name changes go through ollama.rs
Never do: Search main.rs or lib.rs only when
  tuning Ollama request behavior

## ADR-016
Date: 2026-04-09
Decision: BNI pitch prompt enforces strict
  150-word limit and exact memory hook and
  sign-off wording (prompt v2 in DB)
Layer: L1
Context: v1 output was too long and generic
Consequence: Migration updates p_bni_pitch_v1
  system_template and bumps prompt version to 2
Never do: Ship BNI pitch prompts without
  explicit word cap and fixed hook lines

## ADR-017
Date: 2026-04-09
Decision: jobs_menu entries and prompts rows
  are seeded separately; both are required for
  Run a Job visibility and execution
Layer: Tech
Context: Prompts without jobs_menu rows left
  jobs invisible in the UI
Consequence: New jobs need a migration that
  inserts jobs_menu (and usually prompts)
Never do: Seed prompts for a job_id without
  confirming jobs_menu contains that job_id

## ADR-018
Date: 2026-04-09
Decision: fetch() is allowed for RSS and
  external HTTP APIs; localhost Ollama stays
  behind invoke() only
Layer: Tech
Context: CSP and Tauri patterns block direct
  browser fetch to Ollama, not all HTTP
Consequence: Research RSS and public APIs may
  use fetch; Ollama uses ollama_generate only
Never do: Use fetch() to localhost:11434 from
  the frontend

