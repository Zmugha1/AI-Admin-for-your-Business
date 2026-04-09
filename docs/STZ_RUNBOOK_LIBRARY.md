# STZ Runbook Library
# Zubia Pulse Desktop
# Every repeatable sequence ever confirmed.
# Never delete. Only add.

---

## RUN-001
Task: Start development environment
Trigger: Beginning of any dev session
Steps:
  1. Open PowerShell window 1
  2. Run: ollama serve
  3. Leave window 1 open — never close
  4. Open PowerShell window 2
  5. cd to Zubia_Pulse_Desktop folder
  6. Run: npm run tauri dev
  7. Wait 2 to 4 minutes for app window
  8. Confirm green Ollama dot in sidebar
Expected output: App opens, green dot,
  no init errors in console
Watch out for: Port 1420 already in use
  means app is already running.
  Kill existing process first.

## RUN-002
Task: Diagnose and fix migration conflict
Trigger: Init error UNIQUE constraint
  failed schema_migrations.version
Steps:
  1. Run sqlite3 query to see DB state:
     sqlite3 "[DB_PATH]"
     "SELECT version, name FROM
     schema_migrations ORDER BY version;"
  2. Compare DB versions to TypeScript
     migrations array versions
  3. Find duplicate or conflicting versions
  4. Delete duplicate rows from DB:
     sqlite3 "[DB_PATH]"
     "DELETE FROM schema_migrations
     WHERE version = [X];"
  5. Restart app and confirm clean load
Expected output: App loads with no
  init error. All migrations applied.
Watch out for: Deleting a version that
  has already run its SQL will cause
  the SQL to run again on next start.
  Only delete true duplicates.

## RUN-003
Task: Add a new migration safely
Trigger: Any time new database tables
  or columns are needed
Steps:
  1. Run PRAGMA query to check current
     highest version in DB
  2. Run sqlite3 query to check what
     versions are in schema_migrations
  3. Check TypeScript ALL_MIGRATIONS
     array for highest version number
  4. Use highest of DB and code + 1
  5. Write new migration object
  6. Run npx tsc --noEmit
  7. Restart app and confirm applies
Expected output: New tables or columns
  exist. No UNIQUE constraint error.
Watch out for: ALTER TABLE duplicate
  column errors. Always check existing
  columns with PRAGMA table_info first.

## RUN-004
Task: Test Google OAuth connection
Trigger: After any OAuth code change
  or credential update
Steps:
  1. Confirm google_credentials.json
     exists at project root
  2. Confirm Web application client
     type in Google Cloud Console
  3. Confirm http://localhost:8765/callback
     in Authorized redirect URIs
  4. Confirm test user email added
     in OAuth consent screen
  5. Start app and go to Google Integration
  6. Click Connect Google
  7. Confirm browser opens to Google
  8. Sign in with test user email
  9. Confirm "Zubia Pulse connected"
     page appears in browser
  10. Confirm Connected status in app
  11. Click Sync Now
  12. Confirm emails and events appear
Expected output: Connected status,
  emails synced count > 0
Watch out for: access_denied means
  test user not added. redirect_uri_mismatch
  means URI not in console.

## RUN-005
Task: Deploy commit to dev branch
Trigger: After every completed fix
  or feature
Steps:
  1. Run: npx tsc --noEmit
  2. Fix all TypeScript errors before
     proceeding. Warnings are acceptable.
  3. git add [specific files only]
     NEVER git add .
  4. git commit -m "[type]: [description]"
     Types: feat, fix, spec, refactor
  5. git push origin dev
  6. Report commit hash
Expected output: Hash reported.
  No TypeScript errors.
Watch out for: Never push to main.
  Never git add . — always specific files.
  Never proceed if tsc reports errors.

