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
    ('training_material','knowledge','Training Material Builder','Your process','Onboarding document',750,1500,0,1,datetime('now')),
    ('calendar_brief','communicate','Calendar Meeting Brief','Auto from calendar','Pre-call brief',0,0,0,1,datetime('now')),
    ('email_notify','communicate','Important Email Alert','Auto from Gmail','Flagged email summary',0,0,0,1,datetime('now')),
    ('ai_news_curator','patterns','AI News Curator','Auto from RSS feeds','Top 5 stories with signals',0,0,0,1,datetime('now')),
    ('story_to_linkedin','communicate','Story to LinkedIn Post','News story summary','LinkedIn post in your voice',200,300,0,1,datetime('now')),
    ('story_to_blog','document','Story to Blog Post','Story summary plus angle','Full blog post',300,500,0,1,datetime('now'));`,
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
  {
    version: 14,
    name: 'calendar_events',
    sql: `CREATE TABLE IF NOT EXISTS calendar_events (
      event_id TEXT PRIMARY KEY,
      title TEXT,
      start_time TEXT,
      end_time TEXT,
      attendees TEXT,
      contact_id TEXT REFERENCES contacts(contact_id),
      brief_generated INTEGER DEFAULT 0,
      google_event_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );`,
  },
  {
    version: 15,
    name: 'email_notifications',
    sql: `CREATE TABLE IF NOT EXISTS email_notifications (
      notification_id TEXT PRIMARY KEY,
      subject TEXT,
      sender TEXT,
      sender_email TEXT,
      contact_id TEXT REFERENCES contacts(contact_id),
      snippet TEXT,
      is_read INTEGER DEFAULT 0,
      flagged INTEGER DEFAULT 0,
      google_message_id TEXT,
      received_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );`,
  },
  {
    version: 16,
    name: 'news_intelligence',
    sql: `CREATE TABLE IF NOT EXISTS news_feeds (
      feed_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      category TEXT DEFAULT 'ai_business',
      active INTEGER DEFAULT 1,
      last_checked TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS news_items (
      item_id TEXT PRIMARY KEY,
      feed_id TEXT REFERENCES news_feeds(feed_id),
      title TEXT,
      url TEXT,
      published_at TEXT,
      raw_text TEXT,
      summary TEXT,
      signals TEXT,
      relevance_score INTEGER DEFAULT 0,
      surfaced_in_brief INTEGER DEFAULT 0,
      used_for_content INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    INSERT OR IGNORE INTO news_feeds
      (feed_id, name, url, category) VALUES
    ('nf01','MIT Tech Review AI',
      'https://www.technologyreview.com/feed/',
      'ai_business'),
    ('nf02','Harvard Business Review',
      'https://hbr.org/topics/technology/rss',
      'ai_business'),
    ('nf03','VentureBeat AI',
      'https://feeds.feedburner.com/venturebeat/SZYF',
      'ai_business'),
    ('nf04','The Rundown AI',
      'https://www.therundown.ai/rss',
      'ai_business'),
    ('nf05','AI for Business',
      'https://www.forbes.com/ai/feed/',
      'ai_business');`,
  },
  {
    version: 17,
    name: 'seed_phase3_jobs',
    sql: `INSERT OR IGNORE INTO jobs_menu VALUES
    ('calendar_brief','communicate',
      'Calendar Meeting Brief',
      'Auto from calendar','Pre-call brief',
      0,0,0,1,datetime('now')),
    ('email_notify','communicate',
      'Important Email Alert',
      'Auto from Gmail','Flagged email summary',
      0,0,0,1,datetime('now')),
    ('ai_news_curator','patterns',
      'AI News Curator',
      'Auto from RSS feeds',
      'Top 5 stories with signals',
      0,0,0,1,datetime('now')),
    ('story_to_linkedin','communicate',
      'Story to LinkedIn Post',
      'News story summary',
      'LinkedIn post in your voice',
      200,300,0,1,datetime('now')),
    ('story_to_blog','document',
      'Story to Blog Post',
      'Story summary plus angle',
      'Full blog post',
      300,500,0,1,datetime('now'));`,
  },
  {
    version: 18,
    name: 'aha_moments',
    sql: `CREATE TABLE IF NOT EXISTS aha_moments (
      aha_id TEXT PRIMARY KEY,
      raw_input TEXT NOT NULL,
      input_type TEXT DEFAULT 'text',
      key_insight TEXT,
      stz_layer INTEGER,
      domain_area TEXT,
      source_title TEXT,
      confirms_or_challenges TEXT,
      added_to_embeddings INTEGER DEFAULT 0,
      content_worthy INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_aha_layer
      ON aha_moments(stz_layer);
    CREATE INDEX IF NOT EXISTS idx_aha_created
      ON aha_moments(created_at);
    CREATE INDEX IF NOT EXISTS idx_aha_content
      ON aha_moments(content_worthy);`,
  },
  {
    version: 19,
    name: 'spark_discovery_job',
    sql: `INSERT OR IGNORE INTO jobs_menu VALUES
    ('spark_discovery','document',
      'Spark Discovery Questions',
      'Client name + vertical + jobs requested',
      'STZ intake questions for the Spark meeting',
      0,0,0,1,datetime('now'));

    INSERT OR IGNORE INTO prompts
      (prompt_id, job_id, version,
       system_template, user_template)
    VALUES (
      'p_spark_discovery_v1',
      'spark_discovery',
      1,
      'You are Dr. Zubia Mughal. {{identity}}

You are the creator of the Skill Threshold Zone framework. {{voice}}

Your job is to generate targeted STZ discovery questions for a Spark client intake meeting.

The Spark is a 90-minute discovery session where you map where the client expertise is leaking into manual work and show them exactly what AI should be doing instead.

Rules for generating questions:
- Generate exactly 8 to 12 questions total
- Organize by STZ layer — L1, L2, and L4 only for jobs-only clients
- Every question must connect directly to a job they named or a compliance requirement in their vertical
- Ground every question in their specific industry terminology
- Include one probe question under each main question — the probe goes deeper into the same topic
- Format exactly like this for each question:

L[number] — [Layer Name]
Q[number]: [Main question]
Probe: [Follow-up that goes deeper]

- Never generate generic questions that could apply to any client
- Never use workshop or training format
- Never add opening remarks, closing remarks, or materials lists
- Output questions only — no preamble, no summary, no filler
- The questions should sound like an expert consultant who already knows the vertical asking a peer to explain their process',

      'Generate Spark discovery questions for this client intake meeting:

{{input}}

Output the questions only. No preamble. No summary. Questions and probes only.'
    );`,
  },
  {
    version: 20,
    name: 'finances_and_taxes',
    sql: `CREATE TABLE IF NOT EXISTS tax_quarters (
      quarter_id TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      quarter TEXT NOT NULL,
      period_label TEXT NOT NULL,
      due_date TEXT NOT NULL,
      income REAL DEFAULT 0,
      expenses REAL DEFAULT 0,
      profit REAL DEFAULT 0,
      reasonable_salary REAL DEFAULT 0,
      distributions REAL DEFAULT 0,
      estimated_tax_llc REAL DEFAULT 0,
      estimated_tax_scorp_federal REAL DEFAULT 0,
      estimated_tax_scorp_state REAL DEFAULT 0,
      estimated_tax_total REAL DEFAULT 0,
      paid INTEGER DEFAULT 0,
      paid_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS expenses (
      expense_id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      expense_date TEXT NOT NULL,
      quarter TEXT,
      year INTEGER,
      deductible INTEGER DEFAULT 1,
      payment_method TEXT DEFAULT 'credit_card',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_category
      ON expenses(category);
    CREATE INDEX IF NOT EXISTS idx_expenses_quarter
      ON expenses(quarter);
    CREATE INDEX IF NOT EXISTS idx_expenses_year
      ON expenses(year);

    INSERT OR IGNORE INTO tax_quarters
      (quarter_id, year, quarter,
       period_label, due_date)
    VALUES
    ('2026-Q1', 2026, 'Q1',
     'Jan–Mar 2026', '2026-04-15'),
    ('2026-Q2', 2026, 'Q2',
     'Apr–Jun 2026', '2026-06-15'),
    ('2026-Q3', 2026, 'Q3',
     'Jul–Sep 2026', '2026-09-15'),
    ('2026-Q4', 2026, 'Q4',
     'Oct–Dec 2026', '2027-01-15'),
    ('2027-Q1', 2027, 'Q1',
     'Jan–Mar 2027', '2027-04-15');`,
  },
  {
    version: 21,
    name: 'google_auth',
    sql: `CREATE TABLE IF NOT EXISTS google_auth (
      id TEXT PRIMARY KEY DEFAULT 'zubia',
      access_token TEXT,
      refresh_token TEXT,
      token_expiry TEXT,
      scope TEXT,
      connected INTEGER DEFAULT 0,
      last_sync TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    INSERT OR IGNORE INTO google_auth (id)
      VALUES ('zubia');`,
  },
  {
    version: 22,
    name: 'pipeline_stage',
    /* Contacts columns from migrations 1–21 are defined only in v6 (contacts).
       Do not ADD next_action here; it already exists on contacts. */
    sql: `ALTER TABLE contacts
      ADD COLUMN pipeline_stage TEXT
      DEFAULT 'prospect';
    ALTER TABLE contacts
      ADD COLUMN tier TEXT
      DEFAULT 'pulse';
    ALTER TABLE contacts
      ADD COLUMN mrr REAL DEFAULT 0;
    ALTER TABLE contacts
      ADD COLUMN proposal_sent_date TEXT;
    ALTER TABLE contacts
      ADD COLUMN contract_signed_date TEXT;
    ALTER TABLE contacts
      ADD COLUMN build_start_date TEXT;
    ALTER TABLE contacts
      ADD COLUMN go_live_date TEXT;
    ALTER TABLE contacts
      ADD COLUMN health_score TEXT
        DEFAULT 'green';
    ALTER TABLE contacts
      ADD COLUMN days_in_stage INTEGER
        DEFAULT 0;
    UPDATE contacts
      SET pipeline_stage = 'active_client'
      WHERE status = 'active';`,
  },

  {
    version: 23,
    name: 'client_meetings',
    sql: `CREATE TABLE IF NOT EXISTS
      client_meetings (
        meeting_id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL,
        meeting_date TEXT,
        meeting_type TEXT DEFAULT 'spark',
        outcome TEXT,
        transcript_text TEXT,
        summary_generated INTEGER DEFAULT 0,
        summary_text TEXT,
        pain_points_extracted INTEGER DEFAULT 0,
        pain_points_text TEXT,
        followup_sent INTEGER DEFAULT 0,
        followup_text TEXT,
        prep_completed INTEGER DEFAULT 0,
        prep_text TEXT,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (contact_id)
          REFERENCES contacts(contact_id)
      );
    CREATE INDEX IF NOT EXISTS
      idx_client_meetings_contact
      ON client_meetings(contact_id);
    CREATE INDEX IF NOT EXISTS
      idx_client_meetings_date
      ON client_meetings(meeting_date);`,
  },

  {
    version: 24,
    name: 'client_documents',
    sql: `CREATE TABLE IF NOT EXISTS
      client_documents (
        document_id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL,
        document_type TEXT NOT NULL,
        title TEXT,
        content TEXT,
        status TEXT DEFAULT 'draft',
        version INTEGER DEFAULT 1,
        sent_date TEXT,
        signed_date TEXT,
        value REAL DEFAULT 0,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (contact_id)
          REFERENCES contacts(contact_id)
      );
    CREATE INDEX IF NOT EXISTS
      idx_client_docs_contact
      ON client_documents(contact_id);
    CREATE INDEX IF NOT EXISTS
      idx_client_docs_type
      ON client_documents(document_type);`,
  },

  {
    version: 25,
    name: 'client_reminders',
    sql: `CREATE TABLE IF NOT EXISTS
      client_reminders (
        reminder_id TEXT PRIMARY KEY,
        contact_id TEXT,
        reminder_date TEXT NOT NULL,
        message TEXT NOT NULL,
        reminder_type TEXT DEFAULT 'followup',
        priority TEXT DEFAULT 'normal',
        recurring INTEGER DEFAULT 0,
        recurring_days INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        completed_date TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (contact_id)
          REFERENCES contacts(contact_id)
      );
    CREATE INDEX IF NOT EXISTS
      idx_reminders_date
      ON client_reminders(reminder_date);
    CREATE INDEX IF NOT EXISTS
      idx_reminders_contact
      ON client_reminders(contact_id);`,
  },

  {
    version: 26,
    name: 'testimonials',
    sql: `CREATE TABLE IF NOT EXISTS
      testimonials (
        testimonial_id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL,
        request_sent INTEGER DEFAULT 0,
        request_sent_date TEXT,
        request_email_text TEXT,
        received_date TEXT,
        testimonial_text TEXT,
        published INTEGER DEFAULT 0,
        published_where TEXT,
        published_date TEXT,
        rating INTEGER,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (contact_id)
          REFERENCES contacts(contact_id)
      );`,
  },

  {
    version: 27,
    name: 'client_content',
    sql: `CREATE TABLE IF NOT EXISTS
      client_content (
        content_id TEXT PRIMARY KEY,
        contact_id TEXT,
        content_type TEXT NOT NULL,
        title TEXT,
        body TEXT,
        status TEXT DEFAULT 'not_started',
        published_date TEXT,
        published_where TEXT,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (contact_id)
          REFERENCES contacts(contact_id)
      );
    CREATE INDEX IF NOT EXISTS
      idx_client_content_type
      ON client_content(content_type);
    CREATE INDEX IF NOT EXISTS
      idx_client_content_status
      ON client_content(status);

    INSERT OR IGNORE INTO client_content
      (content_id, contact_id,
       content_type, title, status)
    VALUES
      ('pc_blog_1', NULL,
       'blog', 'Blog post due this week',
       'not_started'),
      ('pc_linkedin_1', NULL,
       'linkedin',
       'LinkedIn post — Monday',
       'not_started'),
      ('pc_linkedin_2', NULL,
       'linkedin',
       'LinkedIn post — Wednesday',
       'not_started'),
      ('pc_bni_1', NULL,
       'bni_pitch',
       'BNI weekly pitch',
       'not_started');`,
  },

  {
    version: 28,
    name: 'paper_progress',
    sql: `CREATE TABLE IF NOT EXISTS
      paper_progress (
        paper_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        journal TEXT,
        status TEXT DEFAULT 'in_progress',
        current_section TEXT,
        target_submission TEXT,
        submitted_date TEXT,
        accepted_date TEXT,
        published_date TEXT,
        doi TEXT,
        notes TEXT,
        last_updated TEXT
          DEFAULT (datetime('now')),
        created_at TEXT
          DEFAULT (datetime('now'))
      );

    INSERT OR IGNORE INTO paper_progress
      (paper_id, title, journal,
       status, current_section,
       target_submission)
    VALUES
      ('paper_2026',
       'Theory-Constrained Inductive Bias Using LTSI as a Governance Framework for Small-Data Machine Learning',
       'Under Review — 2026',
       'under_review',
       'Full paper submitted',
       '2026-06-01');`,
  },

  {
    version: 29,
    name: 'client_financials',
    sql: `CREATE TABLE IF NOT EXISTS
      client_financials (
        financial_id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL UNIQUE,
        pricing_model TEXT
          DEFAULT 'per_job',
        retainer_active INTEGER DEFAULT 0,
        retainer_amount REAL DEFAULT 0,
        retainer_billing_date TEXT,
        build_fee REAL DEFAULT 0,
        build_fee_paid INTEGER DEFAULT 0,
        build_fee_paid_date TEXT,
        total_revenue REAL DEFAULT 0,
        total_invoiced REAL DEFAULT 0,
        total_outstanding REAL DEFAULT 0,
        offered_price REAL DEFAULT 0,
        suggested_price REAL DEFAULT 0,
        currency TEXT DEFAULT 'USD',
        notes TEXT,
        created_at TEXT
          DEFAULT (datetime('now')),
        updated_at TEXT
          DEFAULT (datetime('now')),
        FOREIGN KEY (contact_id)
          REFERENCES contacts(contact_id)
      );

    CREATE TABLE IF NOT EXISTS
      client_jobs_pricing (
        pricing_id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL,
        job_id TEXT NOT NULL,
        job_name TEXT NOT NULL,
        suggested_price REAL DEFAULT 0,
        offered_price REAL DEFAULT 0,
        included INTEGER DEFAULT 1,
        notes TEXT,
        created_at TEXT
          DEFAULT (datetime('now')),
        FOREIGN KEY (contact_id)
          REFERENCES contacts(contact_id)
      );

    CREATE INDEX IF NOT EXISTS
      idx_financials_contact
      ON client_financials(contact_id);
    CREATE INDEX IF NOT EXISTS
      idx_jobs_pricing_contact
      ON client_jobs_pricing(contact_id);`,
  },
  {
    version: 30,
    name: 'voice_builder_job',
    sql: `INSERT OR IGNORE INTO jobs_menu
      (job_id, category, name,
       input_description, output_description,
       price_low, price_high, is_custom, active)
    VALUES
      ('voice_builder',
       'document',
       'Voice Builder — Spark Questions',
       'Client name + vertical + background',
       'Generate 10 voice-building discovery questions customized for a new client Spark session',
       0, 0, 0, 1);

    INSERT OR IGNORE INTO prompts
      (prompt_id, job_id, version,
       system_template, user_template)
    VALUES (
      'p_voice_builder_v1',
      'voice_builder',
      1,
      'You are Dr. Zubia Mughal, founder of Dr. Data Decision Intelligence LLC. {{identity}}

You are the creator of the Skill Threshold Zone framework. Your methodology builds decision intelligence systems that learn how an expert thinks, speaks, and makes judgment calls — so the system produces outputs that sound exactly like the expert, not like generic AI.

You are preparing for a Spark discovery session with a new client. Your job is to generate 10 voice-building questions customized for this specific client based on their vertical, background, and the jobs they want to accomplish.

These questions are not generic. They are grounded in the client context provided and designed to extract the five voice library files the system needs:
  reasoning_style — how they think and make judgment calls
  terminology — their exact words and words they never use
  output_templates — what their best work looks like
  edge_case_library — when the obvious answer is wrong
  quality_criteria — how they grade outputs A, B, or C

Rules for generating questions:
- Generate exactly 10 questions
- Label each question with what it captures in Courier New below the question
- Make every question specific to their vertical and background
- Include one probe question under each main question
- Format exactly like this:

Q[number] — [Short title]
[Main question text]
Probe: [Follow-up that goes deeper]
Captures: [what this answer builds in the voice library]

- Never use generic questions that could apply to anyone
- Never use corporate jargon or AI language
- Questions must sound like an expert consultant asking a peer to explain their craft
- No em dashes in any output
- Ground every question in the client vertical and jobs they named',

      'Generate 10 voice-building Spark discovery questions for this client:

{{input}}

Output the questions only. No preamble. No summary. No closing remarks. Questions, probes, and captures only.'
    );`,
  },
  {
    version: 31,
    name: 'research_articles',
    sql: `CREATE TABLE IF NOT EXISTS
      research_articles (
        article_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        authors TEXT,
        source TEXT NOT NULL,
        source_type TEXT DEFAULT 'pubmed',
        year INTEGER,
        abstract TEXT,
        url TEXT,
        doi TEXT,
        stz_layer TEXT,
        status TEXT DEFAULT 'unread',
        notes TEXT,
        saved_at TEXT
          DEFAULT (datetime('now')),
        updated_at TEXT
          DEFAULT (datetime('now'))
      );
    CREATE INDEX IF NOT EXISTS
      idx_articles_source
      ON research_articles(source_type);
    CREATE INDEX IF NOT EXISTS
      idx_articles_status
      ON research_articles(status);`,
  },

  {
    version: 32,
    name: 'rss_feeds',
    sql: `CREATE TABLE IF NOT EXISTS
      rss_feeds (
        feed_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        category TEXT DEFAULT 'ai',
        active INTEGER DEFAULT 1,
        last_fetched TEXT,
        created_at TEXT
          DEFAULT (datetime('now'))
      );

    CREATE TABLE IF NOT EXISTS
      rss_items (
        item_id TEXT PRIMARY KEY,
        feed_id TEXT NOT NULL,
        title TEXT NOT NULL,
        link TEXT,
        summary TEXT,
        published_date TEXT,
        captured INTEGER DEFAULT 0,
        created_at TEXT
          DEFAULT (datetime('now')),
        FOREIGN KEY (feed_id)
          REFERENCES rss_feeds(feed_id)
      );

    CREATE INDEX IF NOT EXISTS
      idx_rss_items_feed
      ON rss_items(feed_id);
    CREATE INDEX IF NOT EXISTS
      idx_rss_items_captured
      ON rss_items(captured);

    INSERT OR IGNORE INTO rss_feeds
      (feed_id, name, url, category)
    VALUES
      ('feed_mit', 'MIT Technology Review',
       'https://www.technologyreview.com/feed/',
       'ai'),
      ('feed_venturebeat',
       'VentureBeat AI',
       'https://venturebeat.com/feed/',
       'ai'),
      ('feed_elearning',
       'eLearning Industry',
       'https://elearningindustry.com/feed',
       'ld'),
      ('feed_insidehighered',
       'Inside Higher Ed',
       'https://www.insidehighered.com/rss/all',
       'education'),
      ('feed_towardsdatascience',
       'Towards Data Science',
       'https://towardsdatascience.com/feed',
       'data'),
      ('feed_hbr', 'Harvard Business Review',
       'https://hbr.org/rss/all',
       'business'),
      ('feed_arxiv',
       'Arxiv AI',
       'https://arxiv.org/rss/cs.AI',
       'research'),
      ('feed_smallbiz',
       'SmallBizTrends',
       'https://smallbiztrends.com/feed',
       'smallbiz'),
      ('feed_aibusiness',
       'AI Business',
       'https://aibusiness.com/rss.xml',
       'ai'),
      ('feed_edusurge',
       'EdSurge',
       'https://www.edsurge.com/news.rss',
       'education');`,
  },

  {
    version: 33,
    name: 'pre_meeting_intelligence_fields',
    sql: `ALTER TABLE contacts
      ADD COLUMN life_context TEXT;
    ALTER TABLE contacts
      ADD COLUMN business_context TEXT;
    ALTER TABLE contacts
      ADD COLUMN communication_style TEXT;
    ALTER TABLE contacts
      ADD COLUMN topics_to_raise TEXT;
    ALTER TABLE contacts
      ADD COLUMN topics_to_avoid TEXT;
    ALTER TABLE contacts
      ADD COLUMN last_meeting_summary TEXT;

    INSERT OR IGNORE INTO jobs_menu
      (job_id, category, name,
       input_description, output_description,
       price_low, price_high, is_custom,
       active)
    VALUES (
      'pre_meeting_brief',
      'intelligence',
      'Pre-Meeting Intelligence Brief',
      'Contact name + optional transcript',
      'One-page brief: who they are, what to bring up, what to listen for, what to avoid',
      0, 0, 0, 1
    );

    INSERT OR IGNORE INTO prompts
      (prompt_id, job_id, version,
       system_template, user_template)
    VALUES (
      'p_pre_meeting_brief_v1',
      'pre_meeting_brief',
      1,
      'You are Dr. Zubia Mughal, founder of Dr. Data Decision Intelligence LLC. {{identity}}

You are preparing for a meeting with a client or prospect. Your job is to generate a pre-meeting intelligence brief using only the context provided. Do not invent details. Do not use generic consultant language. Write in a warm, direct, observational tone that sounds like Dr. Zubia preparing her own notes.

Rules:
- Use only the context provided
- Never invent details not in the context
- Write in first person as Dr. Zubia
- No em dashes ever, use commas or periods
- No generic AI language
- Every section must be grounded in the context provided
- If context is missing for a section say so honestly
- Sound like an expert preparing for a real conversation not a template

Structure the brief exactly like this:

WHO THIS PERSON IS
[2 to 3 sentences on who they are, what matters to them, where they are right now professionally]

WHAT TO BRING UP
[3 specific items based on context, each one sentence, grounded in what is stored about them]

WHAT TO LISTEN FOR
[2 signals this person may send that indicate something has changed or something important is on their mind]

ONE ANALOGY THAT MIGHT LAND
[based on their vertical and background, one comparison that could help explain decision intelligence or AI in terms they already understand]

WHAT NOT TO DO
[1 to 2 things to avoid based on their communication style or background]

OPEN QUESTIONS
[2 questions worth asking early in the meeting to surface what matters most right now]',

      'Generate a pre-meeting intelligence brief for this contact and context:

{{input}}'
    );`,
  },

  {
    version: 34,
    name: 'missing_job_prompts',
    sql: `INSERT OR IGNORE INTO prompts
      (prompt_id, job_id, version,
       system_template, user_template)
    VALUES

    ('p_calendar_brief_v1',
     'calendar_brief', 1,
     'You are Dr. Zubia Mughal, founder of Dr. Data Decision Intelligence LLC. {{identity}}

You generate pre-meeting calendar briefs. Your job is to take a meeting title, attendees, and date and produce a concise one-page brief that prepares the user for the meeting.

Rules:
- No em dashes ever, use commas or periods
- No generic AI language
- Sound like Dr. Zubia wrote this herself
- Ground every point in the context provided
- Be concise, direct, and actionable
- Format with clear sections

Structure:
MEETING OVERVIEW
WHO IS ATTENDING
WHAT TO PREPARE
WHAT TO LISTEN FOR
ONE KEY QUESTION TO ASK',

     'Generate a pre-meeting brief for this calendar event:

{{input}}'),

    ('p_testimonial_request_v1',
     'testimonial_request', 1,
     'You are Dr. Zubia Mughal, founder of Dr. Data Decision Intelligence LLC. {{identity}}

You write warm, genuine testimonial request emails to clients who have experienced results from your decision intelligence systems.

Rules:
- No em dashes ever, use commas or periods
- No generic AI language
- Warm, personal, direct tone
- Reference specific results the client has seen
- Make the ask simple and low friction
- Offer a specific format they can follow
- Never beg or apply pressure
- Sound like Dr. Zubia wrote this herself

The email should:
- Open with a genuine observation about their progress
- Name one specific result they have achieved
- Make a simple ask for a short testimonial
- Give them a format: one sentence on what changed,
  one sentence on what they would tell others
- Close warmly with no pressure',

     'Write a testimonial request email for this client:

{{input}}'),

    ('p_bni_pitch_v1',
     'bni_pitch_generator', 1,
     'You are Dr. Zubia Mughal, founder of Dr. Data Decision Intelligence LLC. {{identity}}

You generate weekly BNI 60-second pitches for the Revenue by Referrals chapter in Milwaukee, Wisconsin.

Rules:
- No em dashes ever, use commas or periods
- No generic AI language
- 60 seconds when read aloud at natural pace
- Open with a client story or observed pattern
- Name the pain point in plain language
- State what you do in one sentence
- End with a specific referral trigger
- Memory hook at the end
- Sound like Dr. Zubia delivering this herself
- Never use: leverage, utilize, streamline,
  cutting-edge, robust, seamless

Structure:
[Opening story or pattern — 2 sentences]
[The pain point — 1 sentence]
[What I do — 1 sentence]
[Who I help — 1 sentence]
[Referral trigger — 1 sentence]
[Memory hook — 1 sentence]',

     'Generate a BNI 60-second pitch for this week.
Topic or angle to use:

{{input}}'),

    ('p_blog_post_v1',
     'blog_post_generator', 1,
     'You are Dr. Zubia Mughal, founder of Dr. Data Decision Intelligence LLC. {{identity}}

You write blog posts for small business owners about decision intelligence, AI adoption, workflow automation, and data-driven decision making.

Rules:
- No em dashes ever, use commas or periods
- No generic AI language
- Every claim grounded in research or observed practice
- Write from the perspective of a practitioner
  not a theorist
- Short paragraphs, one idea per paragraph
- Lead with the outcome not the feature
- Sound like Dr. Zubia wrote every word
- Never use: leverage, utilize, streamline,
  cutting-edge, innovative solution
- Always end with a practical takeaway
  the reader can apply today

Structure:
HEADLINE
[Hook — the pain point or surprising observation]
[The problem most people do not see]
[What the research or practice shows]
[What this means practically]
[One thing to do today]
[Closing — connect to decision intelligence]',

     'Write a blog post on this topic:

{{input}}');`,
  },
];
