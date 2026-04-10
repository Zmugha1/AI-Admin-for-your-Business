import { invoke } from '@tauri-apps/api/core';
import { getDb } from './db';
import { v4 as uuidv4 } from 'uuid';

export async function enqueueJob(
  jobId: string,
  inputText: string,
  contactId?: string
): Promise<string> {
  const db = await getDb();
  const queueId = uuidv4();
  await db.execute(
    `INSERT INTO job_queue
       (queue_id, job_id, contact_id, input_text, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [queueId, jobId, contactId ?? null, inputText]
  );
  return queueId;
}

export async function processNextJob(): Promise<void> {
  const db = await getDb();

  const runningJob = await db.select<
    { queue_id: string; started_at: string }[]
  >(
    `SELECT queue_id, started_at
     FROM job_queue
     WHERE status = 'running'
     LIMIT 1`
  );

  if (runningJob.length > 0) {
    const startedAt = new Date(
      runningJob[0].started_at
    ).getTime();
    const now = Date.now();
    const elapsedSeconds = (now - startedAt) / 1000;
    if (elapsedSeconds < 600) {
      return;
    }
    await db.execute(
      `UPDATE job_queue
       SET status = 'failed',
         error_message = 'Timed out after 600s',
         completed_at = datetime('now')
       WHERE queue_id = ?`,
      [runningJob[0].queue_id]
    );
  }

  const pending = await db.select<{
    queue_id: string;
    job_id: string;
    input_text: string;
    contact_id: string | null;
  }[]>(
    `SELECT queue_id, job_id, input_text, contact_id
     FROM job_queue WHERE status = 'pending'
     ORDER BY created_at ASC LIMIT 1`
  );
  if (pending.length === 0) return;

  const job = pending[0];

  await db.execute(
    `UPDATE job_queue
     SET status = 'running', started_at = datetime('now')
     WHERE queue_id = ?`,
    [job.queue_id]
  );

  try {
    const prompts = await db.select<{
      system_template: string;
      user_template: string;
      version: number;
    }[]>(
      `SELECT system_template, user_template, version
       FROM prompts
       WHERE job_id = ? AND is_active = 1 LIMIT 1`,
      [job.job_id]
    );

    if (prompts.length === 0) {
      throw new Error(
        `No active prompt for job: ${job.job_id}`
      );
    }

    const identity = await db.select<{
      full_name: string;
      title: string;
      bio_short: string;
    }[]>(
      `SELECT full_name, title, bio_short
       FROM identity WHERE id = 'zubia'`
    );

    const voice = await db.select<{ content: string }[]>(
      `SELECT content FROM voice_library
       WHERE id = 'reasoning_style'`
    );

    const identityStr = identity.length > 0
      ? `${identity[0].full_name}, ${identity[0].title}. ${identity[0].bio_short ?? ''}`
      : 'Dr. Zubia Mughal, AI Transformation Lead, Dr. Data Decision Intelligence LLC.';

    const voiceStr = voice.length > 0
      ? voice[0].content : '';

    const systemPrompt = prompts[0].system_template
      .replace('{{identity}}', identityStr)
      .replace('{{voice}}', voiceStr);

    const userPrompt = prompts[0].user_template
      .replace('{{input}}', job.input_text);

    const output = await invoke<string>('ollama_generate', {
      prompt: userPrompt,
      system: systemPrompt,
    });

    await db.execute(
      `UPDATE job_queue
       SET status = 'done', output_text = ?,
           completed_at = datetime('now'),
           prompt_version = ?
       WHERE queue_id = ?`,
      [output, prompts[0].version, job.queue_id]
    );

    await db.execute(
      `INSERT INTO audit_log
         (log_id, action, entity_type, entity_id, details)
       VALUES (?, 'job_completed', 'job_queue', ?, ?)`,
      [uuidv4(), job.queue_id, `Job: ${job.job_id}`]
    );

  } catch (err) {
    await db.execute(
      `UPDATE job_queue
       SET status = 'failed', error_message = ?,
           completed_at = datetime('now')
       WHERE queue_id = ?`,
      [String(err), job.queue_id]
    );
    try {
      await db.execute(
        `INSERT INTO audit_log
         (log_id, action, entity_type,
          entity_id, details)
         VALUES (?, 'job_failed', 'job_queue',
                 ?, ?)`,
        [
          crypto.randomUUID(),
          job.queue_id,
          String(err),
        ]
      );
    } catch {
      console.error('Failed to log job error');
    }
  }
}

export function startQueuePoller(
  intervalMs = 2000
): void {
  setInterval(processNextJob, intervalMs);
}
