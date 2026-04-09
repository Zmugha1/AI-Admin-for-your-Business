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

