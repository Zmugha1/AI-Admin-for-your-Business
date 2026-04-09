# SESSION TEMPLATE
# Zubia Pulse Desktop
# Dr. Data Decision Intelligence LLC
# Copy and paste these prompts into
# Cursor at the start and end of
# every development session.
# Never skip these. They are your
# institutional memory system.

---

## START OF SESSION PROMPT
## Copy everything below this line
## and paste into a new Cursor chat.
## Add your task at the bottom.

START OF SESSION — read before anything else.

Read these files in this exact order:
  .cursorrules
  CLAUDE.md
  docs/STZ_AGENT_SPECIFICATION.md
  docs/STZ_ADR_LOG.md
  docs/STZ_POSTMORTEM_LIBRARY.md
  docs/STZ_RUNBOOK_LIBRARY.md
  docs/STZ_VOICE_LIBRARY.md
  docs/SESSION_LOG.md

These are your permanent operating rules.
Every rule in .cursorrules is non-negotiable.
Every ADR is a decision already made.
Do not rediscover what is already known.
Do not suggest what has already been rejected.
Do not repeat any bug that has a postmortem.

Project: Zubia Pulse Desktop
Builder: Dr. Zubia Mughal, Ed.D.
Company: Dr. Data Decision Intelligence LLC
Repo: github.com/Zmugha1/Zubia_Pulse
Branch: dev only
Push: git push origin dev
DB: zubia_pulse.db
App identifier: com.zubiapulse.desktop
Migrations applied: 1 through 30
Local path: C:\Users\zumah\Documents\
  drdatadecisionintelligence\
  AI-Admin-for-your-Business\
  Zubia_Pulse_Desktop

After reading all spec files confirm:
1. Current migration count
2. Top 3 iron rules from memory
3. Today's first task
4. Which file will be created or modified

Then wait for my instruction to begin.

Today's task: [DESCRIBE YOUR TASK HERE]

---

## END OF SESSION PROMPT
## Copy everything below this line
## and paste into Cursor after your
## last commit of the session.

END OF SESSION — run this now.

Read this entire conversation from
the beginning.
Extract everything learned and update
these files.
Never delete existing content. Only add.

FILE 1 — docs/STZ_ADR_LOG.md
Add any new architecture decisions
made this session. One entry per decision.

Format:
ADR-[next number]
Date: [today]
Decision: [what was decided]
Layer: [L1/L2/L3/L4/L5/Tech]
Context: [why this decision was needed]
Consequence: [what this means going forward]
Never do: [what this decision prevents]

FILE 2 — docs/STZ_POSTMORTEM_LIBRARY.md
Add any bugs found and fixed this session.
One entry per incident.

Format:
INC-[next number]
Date: [today]
What broke: [symptom]
Root cause: [why it broke]
Fix applied: [what fixed it]
Prevention rule: [never do X again]
Commit: [hash where it was fixed]

FILE 3 — docs/STZ_RUNBOOK_LIBRARY.md
Add any repeatable sequences discovered
or confirmed this session.

Format:
RUN-[next number]
Task: [what this runbook accomplishes]
Trigger: [when to use this runbook]
Steps:
  1. [step one]
  2. [step two]
  3. [step three]
Expected output: [what success looks like]
Watch out for: [known failure points]

FILE 4 — docs/STZ_VOICE_LIBRARY.md
Add any new voice rules confirmed
this session.

Format:
VOICE-[next number]
Rule: [the voice rule]
Example good: [what this sounds like]
Example bad: [what to avoid]
STZ source: [which layer this came from]

FILE 5 — CLAUDE.md
Add any new permanent rules discovered
this session. Never remove existing rules.
Add at the bottom under a dated section:

## Rules added [today's date]
[new rule 1]
[new rule 2]

FILE 6 — docs/SESSION_LOG.md
Add a session summary entry:

## Session [today's date]
Commits this session: [list hashes]
ADRs added: [count and titles]
Incidents resolved: [count and titles]
Runbooks added: [count and titles]
Voice rules added: [count]
Next session should start with: [one line]
Blockers or open items: [list or none]

COMMIT ALL CHANGES:
git add docs/
git add CLAUDE.md
git commit -m "spec: session capture [today's date] — ADRs postmortems runbooks updated"
git push origin dev

Report commit hash only.

---

## NEW CLIENT ONBOARDING CHECKLIST
## Use this when starting a new client build.
## Clone DrData_Pulse_Platform first.
## Then follow these steps in order.

STEP 1 — Clone the platform template
  git clone
    github.com/Zmugha1/DrData_Pulse_Platform
  Rename folder to client name
  Create new GitHub repo for client
  Push initial commit

STEP 2 — Run 25 STZ questions
  Open a new Claude conversation
  Use the STZ SME Interview Guide
  Ask all 25 questions in order
  Record every answer verbatim
  Do not paraphrase

STEP 3 — Populate spec files
  Create docs/ folder in client repo
  Copy SESSION_TEMPLATE.md from
    Zubia_Pulse_Desktop/docs/
  Fill STZ_VOICE_LIBRARY.md from
    L1 answers Q1 through Q5
  Fill STZ_ADR_LOG.md from
    any tech decisions made
  Fill STZ_AGENT_SPECIFICATION.md
    with client identity and context
  Commit all spec files before building

STEP 4 — Configure identity
  Open the app
  Go to My Identity
  Paste client bio, resume, methodology
  Save identity
  Confirm audit log shows identity_updated

STEP 5 — Seed first jobs
  Open My Prompts
  Add client-specific prompts
  Ground every prompt in their
    L1 voice library answers
  Test each prompt with sample input
  Grade output A, B, or C
  Only ship A outputs

STEP 6 — Build demo
  Use DrRajDemo pattern as template
  Three jobs with client dummy data
  Full brand styling inline styles
  Human approval gates on every job
  Audit line on every action

STEP 7 — Show demo to client
  Open your own Zubia Pulse first
  Say: this is my system running now
  Then show their demo
  Walk through all three jobs
  Show approve and reject gates
  Show audit log

STEP 8 — Get Spark approval
  Present five-page gap analysis
  Show ROI calculation
  Confirm tier: Pulse, Vault, or Scale
  Get verbal commitment
  Send proposal within two hours

STEP 9 — Get contract signed
  Generate proposal from Run a Job
  Send within two hours of Spark
  Follow up every five days
  Do not start build without signature

STEP 10 — Begin build
  Open new Cursor session
  Paste START OF SESSION with
    client context at bottom
  Build one module at a time
  One prompt per file
  Confirm hash before next prompt

---

## DEMO SCRIPT
## Use this when showing Zubia Pulse
## or a client system to any prospect.

OPENING LINE
"This is my own system running right now.
Everything you see is real. My contacts,
my calendar, my revenue goals, my jobs.
This is not a mockup. This is what I built
for myself before I built it for anyone else."

SCREEN 1 — Morning Brief
"Every morning I open this and know exactly
what needs my attention. Who needs a follow-up.
What meetings are coming. Where I am on
my revenue goal. No hunting. No guessing.
One screen."

SCREEN 2 — Google Integration
"My Gmail and Calendar sync locally.
Nothing leaves my machine. I can see
every email and meeting from my pipeline
contacts in one place. HIPAA compliant
by architecture, not by policy."

SCREEN 3 — Run a Job
"I paste a transcript from our meeting.
In 90 seconds I have a follow-up email
in my voice, grounded in the exact pain
points you named. Not generic. Not ChatGPT.
Mine."

SCREEN 4 — Client Card
"Every client has a full intelligence card.
Pipeline stage. Meeting history. Transcripts.
Documents. Financials. Reminders. All in
one place. Click one button to run a job
for that client specifically."

SCREEN 5 — My STZ Layers
"These are the 25 questions I answered
about how I think, how I work, what I
never do, and what good looks like.
Every output from this system is grounded
in those answers. It sounds like me because
it was built from me."

SCREEN 6 — Audit Log
"Every action logged. Every decision
traceable. Glass box. Nothing hidden.
If something goes wrong I can trace
exactly what happened and why."

CLOSING LINE
"You are looking at [X] hours saved per week.
At your rate of $[Y] per hour that is
$[Z] per year in recovered time.
This system costs $[build + 12 months]
in year one. I built mine in six weeks.
Yours takes two days to configure once
we finish the Spark.
The question is not whether you can
afford this system.
The question is how much longer you
can afford not to have it."

---

## ROI CALCULATOR TEMPLATE
## Fill in with client numbers during
## or after the Spark meeting.

Client name: [name]
Vertical: [vertical]
Hourly rate: $[rate]
Hours saved per week: [hours]
  Invoice generation: [x] minutes saved
  Meeting follow-ups: [x] minutes saved
  Document creation: [x] minutes saved
  Research and briefs: [x] minutes saved
  Total: [sum] minutes = [hours] hours

Weekly value: $[rate x hours]
Annual value: $[weekly x 52]

System cost:
  Build fee: $[tier build fee]
  Monthly: $[tier monthly x 12]
  Year one total: $[build + monthly x 12]

ROI: [annual value / year one cost x 100]%
Payback period: [year one cost /
  weekly value] weeks

Include in proposal:
  "At $[rate]/hour saving [hours] hours
  per week, this system recovers
  $[annual value] in year one.
  Your investment is $[year one cost].
  That is a [ROI]% return in 12 months."
