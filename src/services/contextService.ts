/**
 * contextService.ts
 * Token budget management for Ollama calls.
 *
 * Problem this solves:
 * qwen2.5:7b has a 4096 token context window.
 * A job prompt has four parts:
 *   1. System prompt -- who Zubia is
 *   2. Identity -- her bio and credentials
 *   3. RAG context -- domain library chunks
 *   4. User input -- what was pasted
 *
 * If these four parts exceed 4096 tokens
 * Ollama silently truncates the prompt.
 * Output quality drops with no warning.
 * This service prevents that by budgeting
 * tokens before every Ollama call.
 *
 * Token estimation:
 * 1 token is approximately 4 characters
 * for English text. This is an estimate
 * not an exact count. We use a 10% safety
 * margin to account for variance.
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Total context window for qwen2.5:7b */
const MODEL_CONTEXT_WINDOW = 4096;

/**
 * Maximum tokens reserved for output.
 * Jobs need room to generate a full response.
 * 1024 matches num_predict in Ollama config.
 */
const OUTPUT_RESERVE = 1024;

/**
 * Safety margin -- 10% of context window.
 * Accounts for tokenizer variance between
 * our character estimate and real token count.
 */
const SAFETY_MARGIN = Math.floor(
  MODEL_CONTEXT_WINDOW * 0.1
);

/**
 * Maximum tokens available for the prompt.
 * Context window minus output reserve
 * minus safety margin.
 */
export const MAX_PROMPT_TOKENS =
  MODEL_CONTEXT_WINDOW -
  OUTPUT_RESERVE -
  SAFETY_MARGIN;

// 4096 - 1024 - 410 = 2662 tokens for prompt

/**
 * Token budget allocation per prompt section.
 * These percentages are tuned for Zubia Pulse
 * job types. Adjust if jobs change.
 *
 * System prompt: 20% -- who Zubia is,
 *   her rules, her voice
 * Identity: 15% -- bio, credentials,
 *   pricing, methodology summary
 * RAG context: 40% -- domain library chunks,
 *   the most valuable dynamic content
 * User input: 25% -- what was pasted,
 *   the job-specific input
 */
export const TOKEN_BUDGET = {
  system:   Math.floor(MAX_PROMPT_TOKENS * 0.20),
  identity: Math.floor(MAX_PROMPT_TOKENS * 0.15),
  rag:      Math.floor(MAX_PROMPT_TOKENS * 0.40),
  input:    Math.floor(MAX_PROMPT_TOKENS * 0.25),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TOKEN ESTIMATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Estimate token count for a string.
 * Uses 4 characters per token approximation.
 * Accurate within 10-15% for English text.
 */
export function estimateTokens(text: string): number {
  if (!text || text.length === 0) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Check if a text fits within a token budget.
 * Returns true if it fits, false if it exceeds.
 */
export function fitsInBudget(
  text: string,
  budget: number,
): boolean {
  return estimateTokens(text) <= budget;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEXT TRIMMING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Trim text to fit within a token budget.
 * Trims at word boundaries to avoid
 * cutting mid-word. Adds truncation
 * notice so Ollama knows context was cut.
 *
 * @param text -- the text to trim
 * @param budget -- max tokens allowed
 * @param label -- what section this is
 *   (used in truncation notice)
 */
export function trimToTokenBudget(
  text: string,
  budget: number,
  label: string = 'content',
): string {
  if (!text) return '';
  if (fitsInBudget(text, budget)) return text;

  // Convert budget to character limit
  // with small buffer for truncation notice
  const noticeTokens = 20;
  const contentBudget = budget - noticeTokens;
  const charLimit = contentBudget * 4;

  // Trim at last word boundary before limit
  const trimmed = text.slice(0, charLimit);
  const lastSpace = trimmed.lastIndexOf(' ');
  const cleanTrim = lastSpace > 0
    ? trimmed.slice(0, lastSpace)
    : trimmed;

  const originalTokens = estimateTokens(text);
  const trimmedTokens = estimateTokens(cleanTrim);

  return (
    cleanTrim +
    `\n\n[${label} trimmed: ${trimmedTokens}` +
    ` of ${originalTokens} tokens shown` +
    ` -- full content in domain library]`
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROMPT BUILDER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface PromptParts {
  systemPrompt: string;
  identityContext: string;
  ragContext: string;
  userInput: string;
}

export interface BuiltPrompt {
  system: string;
  user: string;
  totalTokens: number;
  budgetReport: BudgetReport;
}

export interface BudgetReport {
  systemTokens: number;
  systemBudget: number;
  systemFit: boolean;
  identityTokens: number;
  identityBudget: number;
  identityFit: boolean;
  ragTokens: number;
  ragBudget: number;
  ragFit: boolean;
  inputTokens: number;
  inputBudget: number;
  inputFit: boolean;
  totalTokens: number;
  maxAllowed: number;
  withinBudget: boolean;
  warningMessage: string | null;
}

/**
 * Build a complete Ollama prompt from parts.
 * Each part is trimmed to its token budget.
 * Returns the built prompt and a budget report
 * so the caller knows what was trimmed and why.
 *
 * Usage:
 *   const built = buildPrompt({
 *     systemPrompt: prompt.system_template,
 *     identityContext: identity.bio,
 *     ragContext: await buildRagContext(input),
 *     userInput: input,
 *   });
 *   // Use built.system and built.user
 *   // Check built.budgetReport for warnings
 */
export function buildPrompt(
  parts: PromptParts,
): BuiltPrompt {
  // Trim each section to its budget
  const trimmedSystem = trimToTokenBudget(
    parts.systemPrompt,
    TOKEN_BUDGET.system,
    'system prompt',
  );

  const trimmedIdentity = trimToTokenBudget(
    parts.identityContext,
    TOKEN_BUDGET.identity,
    'identity context',
  );

  const trimmedRag = trimToTokenBudget(
    parts.ragContext,
    TOKEN_BUDGET.rag,
    'domain knowledge',
  );

  const trimmedInput = trimToTokenBudget(
    parts.userInput,
    TOKEN_BUDGET.input,
    'user input',
  );

  // Build system message
  const systemParts = [trimmedSystem];
  if (trimmedIdentity) {
    systemParts.push(
      '\n\nIDENTITY CONTEXT:\n' + trimmedIdentity
    );
  }
  if (trimmedRag) {
    systemParts.push(
      '\n\nDOMAIN KNOWLEDGE:\n' + trimmedRag
    );
  }
  const system = systemParts.join('');

  // User message is just the input
  const user = trimmedInput;

  // Calculate token counts
  const systemTokens =
    estimateTokens(parts.systemPrompt);
  const identityTokens =
    estimateTokens(parts.identityContext);
  const ragTokens =
    estimateTokens(parts.ragContext);
  const inputTokens =
    estimateTokens(parts.userInput);
  const totalTokens =
    estimateTokens(system) +
    estimateTokens(user);

  // Build budget report
  const withinBudget =
    totalTokens <= MAX_PROMPT_TOKENS;

  let warningMessage: string | null = null;
  if (!withinBudget) {
    warningMessage =
      `Prompt exceeds budget: ` +
      `${totalTokens} tokens used, ` +
      `${MAX_PROMPT_TOKENS} allowed. ` +
      `Some content was trimmed.`;
  } else if (totalTokens >
    MAX_PROMPT_TOKENS * 0.85) {
    warningMessage =
      `Prompt near limit: ` +
      `${totalTokens} of ` +
      `${MAX_PROMPT_TOKENS} tokens used ` +
      `(${Math.round(
        totalTokens / MAX_PROMPT_TOKENS * 100
      )}%).`;
  }

  const budgetReport: BudgetReport = {
    systemTokens,
    systemBudget: TOKEN_BUDGET.system,
    systemFit: fitsInBudget(
      parts.systemPrompt,
      TOKEN_BUDGET.system
    ),
    identityTokens,
    identityBudget: TOKEN_BUDGET.identity,
    identityFit: fitsInBudget(
      parts.identityContext,
      TOKEN_BUDGET.identity
    ),
    ragTokens,
    ragBudget: TOKEN_BUDGET.rag,
    ragFit: fitsInBudget(
      parts.ragContext,
      TOKEN_BUDGET.rag
    ),
    inputTokens,
    inputBudget: TOKEN_BUDGET.input,
    inputFit: fitsInBudget(
      parts.userInput,
      TOKEN_BUDGET.input
    ),
    totalTokens,
    maxAllowed: MAX_PROMPT_TOKENS,
    withinBudget,
    warningMessage,
  };

  return { system, user, totalTokens, budgetReport };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONVERSATION STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * A single message in a conversation.
 * Keeps token estimate alongside content
 * so we can manage the conversation window.
 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokenEstimate: number;
  timestamp: string;
}

/**
 * A conversation session for a job.
 * Tracks all messages and total tokens.
 * Used for multi-turn job interactions
 * where the user asks follow-up questions.
 */
export interface ConversationSession {
  sessionId: string;
  jobId: string;
  contactId: string | null;
  messages: ConversationMessage[];
  totalTokens: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new conversation session.
 * Called when a job starts.
 */
export function createSession(
  jobId: string,
  contactId: string | null,
  systemMessage: string,
): ConversationSession {
  const systemMsg: ConversationMessage = {
    role: 'system',
    content: systemMessage,
    tokenEstimate: estimateTokens(systemMessage),
    timestamp: new Date().toISOString(),
  };

  return {
    sessionId: crypto.randomUUID(),
    jobId,
    contactId,
    messages: [systemMsg],
    totalTokens: systemMsg.tokenEstimate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Add a message to a conversation session.
 * Automatically trims oldest non-system
 * messages if total tokens exceed budget.
 * Always keeps the system message.
 * Always keeps the most recent exchange.
 */
export function addMessage(
  session: ConversationSession,
  role: 'user' | 'assistant',
  content: string,
): ConversationSession {
  const newMessage: ConversationMessage = {
    role,
    content,
    tokenEstimate: estimateTokens(content),
    timestamp: new Date().toISOString(),
  };

  const updatedMessages = [
    ...session.messages,
    newMessage,
  ];

  const totalTokens = updatedMessages.reduce(
    (sum, msg) => sum + msg.tokenEstimate,
    0,
  );

  // If over budget trim oldest non-system messages
  let trimmedMessages = updatedMessages;
  let trimmedTokens = totalTokens;

  while (
    trimmedTokens > MAX_PROMPT_TOKENS &&
    trimmedMessages.length > 2
  ) {
    // Find first non-system message
    // (keep index 0 which is system)
    const firstNonSystem =
      trimmedMessages.findIndex(
        (m, i) => i > 0 && m.role !== 'system'
      );

    if (firstNonSystem === -1) break;

    trimmedTokens -=
      trimmedMessages[firstNonSystem].tokenEstimate;
    trimmedMessages = [
      ...trimmedMessages.slice(0, firstNonSystem),
      ...trimmedMessages.slice(firstNonSystem + 1),
    ];
  }

  return {
    ...session,
    messages: trimmedMessages,
    totalTokens: trimmedTokens,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get messages formatted for Ollama API.
 * Returns array of role/content pairs.
 */
export function getOllamaMessages(
  session: ConversationSession,
): { role: string; content: string }[] {
  return session.messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));
}

/**
 * Get a summary of the session state.
 * Used for logging and debugging.
 */
export function getSessionSummary(
  session: ConversationSession,
): string {
  const userMessages = session.messages.filter(
    m => m.role === 'user'
  ).length;
  const assistantMessages = session.messages
    .filter(m => m.role === 'assistant').length;

  return (
    `Session ${session.sessionId.slice(0, 8)}: ` +
    `${userMessages} user messages, ` +
    `${assistantMessages} responses, ` +
    `${session.totalTokens} tokens used of ` +
    `${MAX_PROMPT_TOKENS} available ` +
    `(${Math.round(
      session.totalTokens /
      MAX_PROMPT_TOKENS * 100
    )}%)`
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONTEXT HEALTH CHECK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Check the health of a context before
 * sending to Ollama. Returns warnings
 * that should be logged to audit_log.
 *
 * Used in Run a Job before every
 * Ollama invoke() call.
 */
export interface ContextHealth {
  healthy: boolean;
  tokenCount: number;
  tokenPercentage: number;
  warnings: string[];
  recommendations: string[];
}

export function checkContextHealth(
  system: string,
  user: string,
): ContextHealth {
  const systemTokens = estimateTokens(system);
  const userTokens = estimateTokens(user);
  const totalTokens = systemTokens + userTokens;
  const tokenPercentage = Math.round(
    totalTokens / MAX_PROMPT_TOKENS * 100
  );

  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (totalTokens > MAX_PROMPT_TOKENS) {
    warnings.push(
      `Context exceeds budget by ` +
      `${totalTokens - MAX_PROMPT_TOKENS} tokens.` +
      ` Output quality will be degraded.`
    );
    recommendations.push(
      'Shorten user input or reduce RAG chunks.'
    );
  } else if (tokenPercentage > 90) {
    warnings.push(
      `Context at ${tokenPercentage}% capacity. ` +
      `Near limit.`
    );
    recommendations.push(
      'Consider reducing RAG context to 3 chunks.'
    );
  }

  if (systemTokens > TOKEN_BUDGET.system * 1.5) {
    warnings.push(
      `System prompt is very long: ` +
      `${systemTokens} tokens. ` +
      `Consider trimming prompt template.`
    );
  }

  if (userTokens < 10) {
    warnings.push(
      `User input is very short: ` +
      `${userTokens} tokens. ` +
      `Job may produce generic output.`
    );
    recommendations.push(
      'Add more context to the input.'
    );
  }

  return {
    healthy: warnings.length === 0,
    tokenCount: totalTokens,
    tokenPercentage,
    warnings,
    recommendations,
  };
}
