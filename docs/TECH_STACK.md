# Zubia Pulse Desktop -- Tech Stack
# Last confirmed: April 2026
# Never deviate from these versions
# without updating this file first

## App Identity
App name: zubia-pulse
App identifier: com.zubiapulse.desktop
Tauri lib name: tauri_app_lib
DB: zubia_pulse.db

## Frontend
React: 19.1.0
TypeScript: 5.8.3
Vite: 7.0.4
Tailwind CSS: 3.4.19 -- PINNED AT v3
  NEVER upgrade to v4
  tailwind.config.js content path must
  include ./src/**/*.{ts,tsx}

## Tauri Plugins (JS side)
@tauri-apps/api: 2.10.1
@tauri-apps/plugin-sql: 2.3.2
@tauri-apps/plugin-opener: 2
@tauri-apps/plugin-fs: 2.4.5
@tauri-apps/plugin-dialog: 2.6.0
NOTE: NO plugin-shell installed
  Use plugin-opener for opening URLs
  openUrl() from plugin-opener

## UI Libraries
@radix-ui/react-dialog: 1.1.15
@radix-ui/react-tabs: 1.1.13
lucide-react: 1.7.0
recharts: 3.8.1
class-variance-authority: 0.7.1
clsx: 2.1.1
tailwind-merge: 3.5.0
uuid: 13.0.0

## Rust Dependencies (Cargo.toml)
tauri: 2
tauri-build: 2
tauri-plugin-opener: 2
tauri-plugin-sql: 2 (sqlite feature)
tauri-plugin-fs: 2
tauri-plugin-dialog: 2
serde: 1 (derive feature)
serde_json: 1
tokio: 1 (full feature)
reqwest: 0.12 (json feature)
uuid: 1 (v4 feature)
chrono: 0.4 (serde feature)
oauth2: 4 (reqwest feature)
open: 5
base64: 0.22
rand: 0.8
sha2: 0.10
urlencoding: 2
tiny_http: 0.12

## Local AI
Ollama -- local inference only
Model: qwen2.5:7b-instruct-q4_k_m
num_ctx: 4096
num_predict: 1024
temperature: 0.1
timeout: 120s
All Ollama calls via invoke() ONLY
NEVER fetch() to localhost:11434
Tauri CSP blocks direct fetch()

## Embeddings (Phase 2 -- not yet added)
Model: nomic-embed-text via Ollama
Vector store: SQLite-vec or ChromaDB
Chunker: 400 tokens, 50 overlap

## Database
Engine: SQLite via tauri-plugin-sql
Location: C:\Users\zumah\AppData\Roaming\
  com.zubiapulse.desktop\zubia_pulse.db
Migrations applied: 1 through 29
Next migration version: 30
NEVER touch migrations 1-29
Always check schema_migrations before
assigning any new version number

## Architecture Rules
Business logic: services/ only
  NEVER in modules/ or components/
IDs: TEXT UUID via uuidv4()
  NEVER integers
invoke() keys: camelCase from TypeScript
  Rust parameters: snake_case
  Tauri converts automatically
git: NEVER git add .
  Always specific files only
  Always push to dev branch only
  Always end with npx tsc --noEmit

## Known Failure Patterns
1. Migration UNIQUE constraint:
   Always query schema_migrations first
   Fix: sqlite3 DELETE duplicate rows

2. invoke() parameter error:
   camelCase in TS -- snake_case in Rust
   access_token fails -- accessToken works

3. OAuth callback timing:
   Start google_auth_listen BEFORE
   calling google_auth_start

4. Tailwind not styling new module:
   Check tailwind.config.js content path
   Must include ./src/**/*.{ts,tsx}

5. ALTER TABLE duplicate column:
   Always run PRAGMA table_info first

6. Port 1420 already in use:
   taskkill /F /IM "zubia-pulse.exe"
   Kill port 1420 process before restart
