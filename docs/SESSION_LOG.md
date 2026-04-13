# Session Log
# Zubia Pulse Desktop
# Every session summarized.
# Updated by END OF SESSION prompt.

---

## Session 2026-04-07
Commits this session:
  b87c700 through 999fab6 — 35+ commits
Major features built:
  Full app scaffold and all modules
  21 migrations applied
  STZ 25 questions answered
  Google OAuth Gmail Calendar integration
  Dr Raj Demo module
  My Finances LLC vs S-Corp calculator
  Pipeline stages and client tables
  Voice Builder Spark Questions job
  .cursorrules for both repos
Next session should start with:
  Add four pipeline contacts manually
  Then build tabbed client card UI
Open items:
  Tabbed client card — Prompt 2 pending
  Morning Brief panels — Prompt 3 pending
  Research Intelligence — Prompt 4 pending
  Domain Library RAG — Prompt 5 pending

## Session 2026-04-09

Commits this session:
  13fe797  CLAUDE.md normalized
  0ebff31  Tabbed client card five tabs
  2c22ae4  Aha moment delete button
  9bcfb1c  SESSION_TEMPLATE.md Zubia Pulse
  d500f66  SESSION_TEMPLATE.md DrData Platform
  bdc189b  Client card inline split panel
  259e742  Morning Brief six panels
  8686957  Research Intelligence module
  3d617eb  gitignore OAuth ignores
  c08ef12  Pre-Meeting Intelligence Brief
  1acde50  Ollama context 32768
  1c5d6b9  Ollama timeout 600s
  d146c14  Job queue deadlock fix
  e091089  Migration 34 four missing prompts
  f191987  Migration 35 jobs menu entries
  84905ed  BNI pitch prompt v2

ADRs added: 8
  Client card split panel architecture
  Ollama context 32768 for transcripts
  Ollama timeout 600 seconds
  Job queue deadlock timeout pattern
  ollama.rs is the Ollama config file
  BNI pitch strict word limit rule
  Jobs menu and prompts seeded separately
  fetch() allowed for RSS and external HTTP

Incidents resolved: 7
  Job queue deadlock
  Ollama context window too small
  Ollama timeout on long transcripts
  BNI pitch too long and generic
  Jobs invisible due to missing menu entry
  Port 1420 in use on restart
  Client card overlay covered full page

Runbooks added: 3
  Clear stuck job queue
  Full app restart sequence
  Test job queue is working

Voice rules added: 3
  Never use seamless
  BNI pitch exact memory hook required
  BNI pitch 150 word maximum

Next session should start with:
  Test BNI pitch v2 output
  Test Pre-Meeting Brief with Dr. Raj
  Test transcript extraction with
    short segment first
  Then start Domain Library build

Blockers or open items:
  Pre-Meeting Brief transcript extraction
    needs testing with short segment
  Domain Library RAG not yet built
  System Health Dashboard not yet built
  Four pipeline contacts added but
    MRR values not yet set in client cards
  Morning Brief revenue panel will show
    zero until MRR values are entered

## Session 2026-04-13

Commits this session:
  aac5b96 -- RSS news feed fix
  a373a75 -- Domain Library migrations
             37-38, Rust chunker, embedder
  467984f -- TECH_STACK.md added
  267c04a -- Migration 39 -- 10 domain
             library jobs seeded
  d48c21f -- Fix prompt job_id alignment
  fa58927 -- Dr Raj Morning Brief page
  14c0905 -- Source visibility councils
  7546951 -- Dr Raj council pages
  edbc994 -- Multi-agent council update
  b509b9e -- START AI button
  cb4240a -- DrRajDemo full brand styling
  5ad79a4 -- Wire DrRajDemo sidebar
  0f1e387 -- Migrations 22-29 pipeline
             client cards financials
  [Dr Raj sources commit pending]

ADRs added: 4
  Domain Library nomic embeddings
  Dr Raj separate repo decision
  GLM-5.1 cloud dev only
  Migration versioning discipline

Incidents resolved: 3
  Migration UNIQUE constraint pattern
  proposal_gen orphaned job_id
  invoke() camelCase parameter error

Runbooks added: 4
  Fix migration UNIQUE constraint
  Add document to Domain Library
  Kill stuck Tauri session
  Connect Google OAuth

Voice rules added: 3
  No em dashes
  Human test before output leaves
  Lead with pain not feature

Next session should start with:
  Run Dr Raj sources commit hash
  Test Proposal and Pricing Generator
  Build Dr-Raj_Intel repo from scratch
  Priority: Dr Raj demo ready for Monday

Blockers or open items:
  Dr Raj sources commit pending hash
  Dr-Raj_Intel repo needs scaffold
  plugin-shell not installed -- using
    plugin-opener workaround
  Morning Brief live panels not yet
    wired to real data
  Client card tabs 2-5 content sparse
  System Health Dashboard not built

