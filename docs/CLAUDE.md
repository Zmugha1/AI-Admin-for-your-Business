# Zubia Pulse Desktop — Claude / Cursor notes
# Never delete. Only add.

## Rules added 2026-04-13

Domain Library is built and operational.
  migrations 37-38 applied cleanly
  nomic-embed-text confirmed on machine
  8 documents embedded -- 284 chunks
  RAG context available for all jobs

Migration state as of April 13 2026:
  Versions 1-39 applied cleanly
  Next migration is version 40+
  Always check schema_migrations first

Dr. Raj engagement confirmed:
  Gmail: hcexperts23@gmail.com
  Search terms: DILI, hepatotoxicity,
    ALT, bilirubin, Hy's Law,
    clinical hold for liver injury,
    boxed warning for liver,
    program paused, enrollment suspended
  20 sources confirmed -- see Capture
  Repo: github.com/Zmugha1/Dr-Raj_Intel
  Build separately from Zubia Pulse
  Vault tier -- Tauri v2 airgapped

Tech stack confirmed April 2026:
  Tauri 2, React 19.1, TypeScript 5.8.3
  Vite 7.0.4, Tailwind 3.4.19 PINNED
  reqwest 0.12, tokio 1 full
  uuid 1, chrono 0.4, oauth2 4
  open 5, tiny_http 0.12
  plugin-opener 2 -- NO plugin-shell
  plugin-sql 2.3.2
  Migrations 1-39 applied
  Next migration: 40+

GLM-5.1 cloud approved for dev only:
  Use for Cursor prompts and debugging
  NEVER for client data
  NEVER in Vault deployments
  Watch for local quantized version

Model evaluation list for Sequence 12:
  Current: qwen2.5:7b-instruct-q4_k_m
  Candidates: Gemma 4, GLM-5.1 local,
    phi4:latest, llama3.1:8b
  Rule: only fully local models
    in client deployments
