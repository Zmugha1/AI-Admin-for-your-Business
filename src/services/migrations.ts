export const ALL_MIGRATIONS = [
  {
    version: 1,
    name: 'schema_migrations',
    sql: `CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT DEFAULT (datetime('now'))
    );`,
  },
  {
    version: 2,
    name: 'identity',
    sql: `CREATE TABLE IF NOT EXISTS identity (
      id TEXT PRIMARY KEY DEFAULT 'zubia',
      full_name TEXT NOT NULL DEFAULT 'Dr. Zubia Mughal',
      credentials TEXT DEFAULT 'Ed.D.',
      title TEXT DEFAULT 'AI Transformation Lead | Founder, Dr. Data Decision Intelligence LLC',
      company TEXT DEFAULT 'Dr. Data Decision Intelligence LLC',
      location TEXT DEFAULT 'Milwaukee, WI',
      email TEXT DEFAULT 'zubiamL4L@gmail.com',
      phone TEXT DEFAULT '414-544-7777',
      website TEXT DEFAULT 'drdatadecisionintelligence.com',
      linkedin TEXT DEFAULT 'linkedin.com/in/zubiamughal',
      bni_chapter TEXT DEFAULT 'Revenue by Referrals',
      bio_short TEXT,
      bio_long TEXT,
      resume_text TEXT,
      dissertation_summary TEXT,
      frameworks_summary TEXT,
      pricing_model TEXT,
      stz_framework_summary TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    INSERT OR IGNORE INTO identity (id) VALUES ('zubia');`,
  },
  {
    version: 3,
    name: 'voice_library',
    sql: `CREATE TABLE IF NOT EXISTS voice_library (
      id TEXT PRIMARY KEY,
      layer TEXT NOT NULL,
      file_name TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      version INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    INSERT OR IGNORE INTO voice_library
      (id, layer, file_name, content) VALUES
      ('reasoning_style','L1','reasoning_style.txt',''),
      ('terminology','L1','terminology.json','{}'),
      ('output_templates','L1','output_templates.txt',''),
      ('edge_case_library','L1','edge_case_library.txt',''),
      ('quality_criteria','L1','quality_criteria.txt','');`,
  },
  {
    version: 4,
    name: 'prompts',
    sql: `CREATE TABLE IF NOT EXISTS prompts (
      prompt_id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      system_template TEXT NOT NULL,
      user_template TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_prompts_job
      ON prompts(job_id);
    CREATE INDEX IF NOT EXISTS idx_prompts_active
      ON prompts(is_active);
    INSERT OR IGNORE INTO prompts
      (prompt_id, job_id, version, system_template, user_template)
    VALUES
    ('p_follow_up_v1','follow_up_email',1,
    'You are Dr. Zubia Mughal. {{identity}}
Your voice and quality standard: {{voice}}
Job: Write a follow-up email after a meeting.
Rules:
- Sound exactly like Dr. Zubia wrote this herself
- Reference specific things from the meeting
- Warm but professional tone
- One clear next step at the end
- Under 200 words unless situation requires more
- Never start with I hope this email finds you well
- Never use as per our conversation',
    'Here is the meeting transcript or notes:
{{input}}
Write the follow-up email now.'),
    ('p_linkedin_v1','linkedin_post',1,
    'You are Dr. Zubia Mughal. {{identity}}
Your voice: {{voice}}
Job: Write a LinkedIn post.
Rules:
- Hook in the first line
- One clear idea per post
- Practical and specific not motivational fluff
- End with a question or clear point of view
- 150 to 300 words maximum
- Maximum 3 hashtags at the end
- Never start with Excited to share or Thrilled to announce',
    'Write a LinkedIn post about this topic:
{{input}}'),
    ('p_blog_v1','blog_builder',1,
    'You are Dr. Zubia Mughal. {{identity}}
Your voice: {{voice}}
Job: Write a blog post for drdatadecisionintelligence.com.
Audience: small business owners and professional service providers.
Structure: Hook, Problem, Insight, Application, CTA.
Length: 600 to 900 words.',
    'Write a blog post on this topic:
{{input}}'),
    ('p_meeting_summary_v1','meeting_summary',1,
    'You are Dr. Zubia Mughal. {{identity}}
Job: Extract a structured meeting summary.
Output format:
MEETING SUMMARY
Date: [extract or use today]
Participants: [all names]
KEY DECISIONS
- [each decision]
ACTION ITEMS
- [person]: [action] by [date]
OPEN QUESTIONS
- [unresolved items]
KEY SIGNALS
- [pain, readiness, or risk signals]',
    'Extract a structured summary from this transcript:
{{input}}'),
    ('p_pain_v1','pain_extractor',1,
    'You are Dr. Zubia Mughal. {{identity}}
Job: Extract pain points from transcript or notes.
Output format:
PAIN POINTS IDENTIFIED
EXPLICIT (said directly):
1. [pain] - [quote]
IMPLIED (between the lines):
1. [pain] - [signal]
URGENCY:
HIGH: [pains needing solution now]
MEDIUM: [pains they live with]
LOW: [pains they ignore]',
    'Extract pain points from this transcript:
{{input}}'),
    ('p_re_engagement_v1','re_engagement',1,
    'You are Dr. Zubia Mughal. {{identity}}
Your voice: {{voice}}
Job: Write a re-engagement message for a contact who has gone quiet.
Rules:
- Warm not desperate
- Reference something specific from last conversation
- Give low-friction reason to respond
- One question maximum
- Under 100 words
- Never say just checking in',
    'Write a re-engagement message for this contact:
{{input}}'),
    ('p_action_v1','action_extractor',1,
    'You are Dr. Zubia Mughal. {{identity}}
Job: Extract all action items from a meeting transcript.
Output format:
ACTION ITEMS
[Person]: [Action] - Due: [date or TBD]
List every commitment. Include owner and due date.',
    'Extract all action items from this transcript:
{{input}}'),
    ('p_doc_synth_v1','doc_synthesizer',1,
    'You are Dr. Zubia Mughal. {{identity}}
Job: Synthesize multiple documents into one unified document.
Rules:
- Preserve all critical information
- Eliminate redundancy
- Organize by theme not by source
- Use clear headers
- Flag contradictions with [CONFLICT: ...]',
    'Synthesize these documents:
{{input}}'),
    ('p_key_points_v1','key_points_reader',1,
    'You are Dr. Zubia Mughal. {{identity}}
Job: Extract the five most important points.
Output format:
KEY POINTS
1. [Point] - [why this matters]
2. [Point] - [why this matters]
3. [Point] - [why this matters]
4. [Point] - [why this matters]
5. [Point] - [why this matters]
WHAT THIS MEANS FOR YOU:
[One paragraph connecting to Dr. Zubia work]',
    'Extract the five most important points:
{{input}}'),
    ('p_workshop_v1','workshop_outline',1,
    'You are Dr. Zubia Mughal. {{identity}}
Job: Build a complete workshop session outline.
Output format:
WORKSHOP OUTLINE
Title: [title]
Duration: [duration]
Audience: [audience]
Objective: [one sentence]
OPENING (10% of time)
CONTENT BLOCKS (70% of time)
CLOSING (20% of time)
MATERIALS NEEDED:',
    'Build a workshop outline for this session:
{{input}}');`,
  },
  {
    version: 5,
    name: 'stz_config',
    sql: `CREATE TABLE IF NOT EXISTS stz_config (
      id TEXT PRIMARY KEY,
      layer INTEGER NOT NULL,
      layer_name TEXT NOT NULL,
      question_num INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      probe_text TEXT,
      answer TEXT DEFAULT '',
      builds_file TEXT,
      completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    INSERT OR IGNORE INTO stz_config VALUES
    ('q01',1,'Prompts',1,'Walk me through the last time you made a judgment call about a client situation that was not obvious. What did you notice, what did you weigh, and how did you decide?','What would a less experienced consultant have missed?','','reasoning_style.txt',0,datetime('now'),datetime('now')),
    ('q02',1,'Prompts',2,'What terms, phrases, or labels do you use in your practice that are specific to your methodology?','Any words you actively avoid?','','terminology.json',0,datetime('now'),datetime('now')),
    ('q03',1,'Prompts',3,'Show me the best thing you have written for a client. What makes this one good?','What do you hear in that writing?','','output_templates.txt',0,datetime('now'),datetime('now')),
    ('q04',1,'Prompts',4,'Tell me about a situation where you knew the obvious recommendation was wrong before you could explain why.','Does that situation come up often enough that the AI should know to watch for it?','','edge_case_library.txt',0,datetime('now'),datetime('now')),
    ('q05',1,'Prompts',5,'If the system produced an output and you had to grade it A B or C what would make it an A?','Is there a phrase that would tell you immediately whether the AI understood your reasoning?','','quality_criteria.txt',0,datetime('now'),datetime('now')),
    ('q06',2,'Skills',1,'Walk me through the exact steps you take when you do your best work on a follow-up email.','Where does the judgment happen?','','skill_map.json',0,datetime('now'),datetime('now')),
    ('q07',2,'Skills',2,'Which of your jobs involves the most steps that have to happen in a specific order?','Is there a step that looks simple but is where most of your expertise shows up?','','skill_map.json',0,datetime('now'),datetime('now')),
    ('q08',2,'Skills',3,'What data or information does each job need before it can start?','Is any of it information only you would know where to find?','','scoring_weights.json',0,datetime('now'),datetime('now')),
    ('q09',2,'Skills',4,'How do you know when a job output is good enough to act on?','Has that threshold ever moved?','','scoring_weights.json',0,datetime('now'),datetime('now')),
    ('q10',2,'Skills',5,'Are there any jobs where you have a scoring system even an informal one in your head?','If you had to put numbers on it what would the weights be?','','scoring_weights.json',0,datetime('now'),datetime('now')),
    ('q11',3,'Agents',1,'What triggers each of your main jobs?','Is the trigger always the same or does it depend on context?','','agent_map.json',0,datetime('now'),datetime('now')),
    ('q12',3,'Agents',2,'If you were out of the office for a week and an assistant was running your practice what instructions would you give them?','What would you be most nervous about them getting wrong?','','agent_map.json',0,datetime('now'),datetime('now')),
    ('q13',3,'Agents',3,'Are there any jobs that should trigger other jobs automatically?','What chains exist in your practice?','','agent_map.json',0,datetime('now'),datetime('now')),
    ('q14',3,'Agents',4,'What information does each job need to pass to the next job?','Is there anything that gets lost in that handoff right now?','','ingestion_config.json',0,datetime('now'),datetime('now')),
    ('q15',3,'Agents',5,'If the system could monitor something in the background and alert you what would be most valuable?','How urgent is each signal?','','ingestion_config.json',0,datetime('now'),datetime('now')),
    ('q16',4,'Contracts',1,'What does the AI absolutely never do without your review and approval?','Has anything ever gone out under your name that you wish you had caught first?','','approval_gates.json',0,datetime('now'),datetime('now')),
    ('q17',4,'Contracts',2,'Are there clients or situations where the approval gate should be tighter?','What makes those situations different?','','approval_gates.json',0,datetime('now'),datetime('now')),
    ('q18',4,'Contracts',3,'What are your non-negotiables things the system should never say never do never recommend?','Has a client ever been hurt by an AI output without these guardrails?','','privacy_policy.json',0,datetime('now'),datetime('now')),
    ('q19',4,'Contracts',4,'How should the system handle data privacy?','Are there specific clients whose data requires extra protection?','','privacy_policy.json',0,datetime('now'),datetime('now')),
    ('q20',4,'Contracts',5,'If the system produces an output you disagree with what is the process?','Is there a situation where you would shut a job down entirely?','','handoff_protocol.json',0,datetime('now'),datetime('now')),
    ('q21',5,'Evaluation',1,'How do you know a month from now whether the system is working?','What would tell you it has gotten worse?','','evaluation.config',0,datetime('now'),datetime('now')),
    ('q22',5,'Evaluation',2,'What is your correction process?','Do you have a way to track corrections right now?','','evaluation.config',0,datetime('now'),datetime('now')),
    ('q23',5,'Evaluation',3,'Which jobs should get better automatically the more you use them?','Is there a job where you do NOT want the system to learn?','','post_call_rubric.json',0,datetime('now'),datetime('now')),
    ('q24',5,'Evaluation',4,'What does success look like for your practice in 90 days if the system is working perfectly?','What is the single most important metric you would track?','','success_criteria.txt',0,datetime('now'),datetime('now')),
    ('q25',5,'Evaluation',5,'What is the one thing you are most worried the system will get wrong?','How would you catch that failure before it reaches a client?','','success_criteria.txt',0,datetime('now'),datetime('now'));`,
  },
  {
    version: 6,
    name: 'contacts',
    sql: `CREATE TABLE IF NOT EXISTS contacts (
      contact_id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      company TEXT,
      role TEXT,
      vertical TEXT,
      email TEXT,
      phone TEXT,
      linkedin TEXT,
      source TEXT,
      status TEXT DEFAULT 'prospect',
      zone_position TEXT,
      last_contact TEXT,
      next_action TEXT,
      next_action_date TEXT,
      notes TEXT,
      bni_member INTEGER DEFAULT 0,
      gone_quiet INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_contacts_status
      ON contacts(status);
    CREATE INDEX IF NOT EXISTS idx_contacts_source
      ON contacts(source);
    CREATE INDEX IF NOT EXISTS idx_contacts_gone_quiet
      ON contacts(gone_quiet);`,
  },
  {
    version: 7,
    name: 'interactions',
    sql: `CREATE TABLE IF NOT EXISTS interactions (
      interaction_id TEXT PRIMARY KEY,
      contact_id TEXT REFERENCES contacts(contact_id),
      type TEXT NOT NULL,
      summary TEXT,
      transcript_text TEXT,
      pain_points TEXT,
      action_items TEXT,
      signals TEXT,
      outcome TEXT,
      interaction_date TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_interactions_contact
      ON interactions(contact_id);
    CREATE INDEX IF NOT EXISTS idx_interactions_date
      ON interactions(interaction_date);`,
  },
  {
    version: 8,
    name: 'jobs_menu',
    sql: `CREATE TABLE IF NOT EXISTS jobs_menu (
      job_id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      input_description TEXT,
      output_description TEXT,
      price_low INTEGER,
      price_high INTEGER,
      is_custom INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
    INSERT OR IGNORE INTO jobs_menu VALUES
    ('follow_up_email','communicate','Follow-Up Email','Meeting transcript','Email in your voice',200,300,0,1,datetime('now')),
    ('re_engagement','communicate','Re-Engagement Message','Contact and history','Outreach message',200,300,0,1,datetime('now')),
    ('referral_thankyou','communicate','Referral Thank You','Referral details','Personal thank you',200,300,0,1,datetime('now')),
    ('newsletter_draft','communicate','Newsletter Draft','5 bullet points','Full newsletter',300,500,0,1,datetime('now')),
    ('linkedin_post','communicate','LinkedIn Post','Topic or idea','Post in your voice',200,300,0,1,datetime('now')),
    ('cold_outreach','communicate','Cold Outreach','Contact profile','First message',200,300,0,1,datetime('now')),
    ('doc_synthesizer','document','Document Synthesizer','2-3 documents','One unified document',500,750,0,1,datetime('now')),
    ('meeting_summary','document','Meeting Summary','Transcript','Structured summary',300,500,0,1,datetime('now')),
    ('proposal_gen','document','Proposal Generator','Client profile and goals','Full proposal',500,750,0,1,datetime('now')),
    ('status_update','document','Status Update','Progress notes','Client-ready update',200,300,0,1,datetime('now')),
    ('sop_builder','document','SOP Builder','How you do something','Written procedure',500,750,0,1,datetime('now')),
    ('onboarding_pack','document','Onboarding Pack','Client intake form','Welcome document',300,500,0,1,datetime('now')),
    ('workshop_outline','document','Workshop Outline Builder','Topic and audience','Full session outline',300,500,0,1,datetime('now')),
    ('blog_builder','document','Blog Post Builder','Topic and key points','Full blog post',300,500,0,1,datetime('now')),
    ('sow_generator','document','Statement of Work','Proposal and notes','Full SOW',500,750,0,1,datetime('now')),
    ('pain_extractor','extract','Pain Point Extractor','Transcript or notes','Pain points listed',300,500,0,1,datetime('now')),
    ('action_extractor','extract','Action Item Extractor','Meeting transcript','Action list',200,300,0,1,datetime('now')),
    ('risk_flag_finder','extract','Risk Flag Finder','Document or notes','Red flags surfaced',500,750,0,1,datetime('now')),
    ('key_points_reader','extract','Key Points Reader','Any document','Top 5 takeaways',200,300,0,1,datetime('now')),
    ('contract_english','extract','Contract Plain English','Legal document','Plain language summary',500,750,0,1,datetime('now')),
    ('competitive_intel','extract','Competitive Intel Reader','Competitor content','Comparison summary',300,500,0,1,datetime('now')),
    ('trend_finder','patterns','Trend Finder','Articles or reports','Patterns and signals',750,1500,0,1,datetime('now')),
    ('client_patterns','patterns','Client Pattern Detector','Multiple client notes','Common themes',750,1500,0,1,datetime('now')),
    ('revenue_signals','patterns','Revenue Signal Finder','Notes or emails','Buying signals surfaced',750,1500,0,1,datetime('now')),
    ('gone_quiet','patterns','Gone Quiet Detector','Contact history','At-risk list',1000,2500,0,1,datetime('now')),
    ('objection_pat','patterns','Objection Pattern','Past meeting notes','Recurring objections',750,1500,0,1,datetime('now')),
    ('voice_library_job','knowledge','Voice Library','Your best writing','Reusable prompt set',750,1500,0,1,datetime('now')),
    ('expert_profile','knowledge','Expert Profile','Your methodology','Structured knowledge base',1500,2500,0,1,datetime('now')),
    ('exception_library','knowledge','Exception Library','Your edge cases','AI training examples',1500,2500,0,1,datetime('now')),
    ('faq_builder','knowledge','FAQ Builder','Past emails or notes','FAQ document',500,750,0,1,datetime('now')),
    ('training_material','knowledge','Training Material Builder','Your process','Onboarding document',750,1500,0,1,datetime('now'));`,
  },
  {
    version: 9,
    name: 'job_queue',
    sql: `CREATE TABLE IF NOT EXISTS job_queue (
      queue_id TEXT PRIMARY KEY,
      job_id TEXT REFERENCES jobs_menu(job_id),
      contact_id TEXT REFERENCES contacts(contact_id),
      input_text TEXT NOT NULL,
      output_text TEXT,
      status TEXT DEFAULT 'pending',
      error_message TEXT,
      prompt_version INTEGER,
      started_at TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_queue_status
      ON job_queue(status);
    CREATE INDEX IF NOT EXISTS idx_queue_job
      ON job_queue(job_id);
    CREATE INDEX IF NOT EXISTS idx_queue_created
      ON job_queue(created_at);`,
  },
  {
    version: 10,
    name: 'job_runs_and_exceptions',
    sql: `CREATE TABLE IF NOT EXISTS job_runs (
      run_id TEXT PRIMARY KEY,
      queue_id TEXT REFERENCES job_queue(queue_id),
      job_id TEXT REFERENCES jobs_menu(job_id),
      contact_id TEXT,
      output_text TEXT,
      corrected_output TEXT,
      was_corrected INTEGER DEFAULT 0,
      quality_score INTEGER,
      run_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS exceptions (
      exception_id TEXT PRIMARY KEY,
      job_id TEXT REFERENCES jobs_menu(job_id),
      run_id TEXT REFERENCES job_runs(run_id),
      wrong_output TEXT,
      correct_output TEXT,
      reason TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_exceptions_job
      ON exceptions(job_id);`,
  },
  {
    version: 11,
    name: 'business_goals',
    sql: `CREATE TABLE IF NOT EXISTS business_goals (
      goal_id TEXT PRIMARY KEY,
      month TEXT NOT NULL UNIQUE,
      revenue_target INTEGER DEFAULT 20000,
      revenue_actual INTEGER DEFAULT 0,
      builds_target INTEGER DEFAULT 2,
      builds_actual INTEGER DEFAULT 0,
      jobs_sold INTEGER DEFAULT 0,
      maintenance_clients INTEGER DEFAULT 0,
      maintenance_revenue INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    INSERT OR IGNORE INTO business_goals
      (goal_id, month, revenue_target)
    VALUES ('2026-04', '2026-04', 20000);`,
  },
  {
    version: 12,
    name: 'content_queue',
    sql: `CREATE TABLE IF NOT EXISTS content_queue (
      content_id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT,
      topic TEXT,
      status TEXT DEFAULT 'queued',
      draft_text TEXT,
      published_url TEXT,
      scheduled_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_content_status
      ON content_queue(status);
    CREATE INDEX IF NOT EXISTS idx_content_scheduled
      ON content_queue(scheduled_date);`,
  },
  {
    version: 13,
    name: 'audit_log',
    sql: `CREATE TABLE IF NOT EXISTS audit_log (
      log_id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      details TEXT,
      logged_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_audit_action
      ON audit_log(action);
    CREATE INDEX IF NOT EXISTS idx_audit_logged
      ON audit_log(logged_at);`,
  },
];
