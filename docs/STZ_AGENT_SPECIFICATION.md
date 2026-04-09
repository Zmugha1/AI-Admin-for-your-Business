# STZ Agent Specification
# Zubia Pulse Desktop
# Master context seed file.
# Paste this at the start of any new
# Cursor session to load full context.
# Updated automatically by END OF SESSION.

---

## IDENTITY
Builder: Dr. Zubia Mughal, Ed.D.
Company: Dr. Data Decision Intelligence LLC
App: Zubia Pulse Desktop
Repo: github.com/Zmugha1/Zubia_Pulse
Branch: dev only
DB path: C:\Users\zumah\AppData\Roaming\
  com.zubiapulse.desktop\zubia_pulse.db
Current migrations: 1 through 30 applied

## TECH STACK — NEVER DEVIATE
Tauri v2, React 19, TypeScript, Vite 5
Tailwind CSS v3 pinned — never v4
SQLite via tauri-plugin-sql
Ollama via invoke() — never fetch()
No OpenAI, no Anthropic, no cloud DB
UUID for all IDs — TEXT type always

## TOP 10 RULES — NEVER VIOLATE
1. No em dashes in any output ever
2. All Ollama calls via invoke() only
3. Never fetch() to localhost:11434
4. Never upgrade Tailwind to v4
5. Never use integer IDs
6. Never git add . — specific files only
7. Never push to main — dev only
8. Never touch applied migrations
9. Always end with npx tsc --noEmit
10. Human approval gate on every output

## KNOWN FAILURE PATTERNS — AVOID
See STZ_POSTMORTEM_LIBRARY.md for full list.
Top five to avoid immediately:
  Migration UNIQUE constraint: check DB
    before assigning version numbers
  invoke() snake_case: always camelCase
  OAuth callback: listen before open
  Tailwind not working: check content path
  ALTER TABLE duplicate: check PRAGMA first

## ARCHITECTURE DECISIONS — ALREADY MADE
See STZ_ADR_LOG.md for full list.
Never re-suggest what is in the ADR log.
Never re-discover what has a postmortem.

