/** Server-only Gemini config. Never import from client components. */

/**
 * Ordered fallback list (comma-separated via GEMINI_MODELS).
 * Verified against Generative Language API models list (2026-11-17):
 * both `gemini-3.8-flash` and `gemini-3.1-flash-lite` exist and support
 * multimodal image + PDF document understanding.
 */
export const DEFAULT_GEMINI_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite",
] as const;

/** @deprecated Prefer getGeminiModels(); kept as first-model alias. */
export const DEFAULT_GEMINI_MODEL = DEFAULT_GEMINI_MODELS[0];

/** Per-attempt cap — keep short so fallback models are reached quickly. */
export const GEMINI_ATTEMPT_TIMEOUT_MS = 20_000;
/** Retries after the first attempt, per model (total attempts = 1 + this). */
export const GEMINI_MAX_RETRIES_PER_MODEL = 1;

export function getGeminiApiKey(): string {
  return process.env.GEMINI_API_KEY?.trim() ?? "";
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

export function missingGeminiMessage(): string {
  return "GEMINI_API_KEY is not set. Add it to .env.local (server-only) and restart the app. Manual expense entry still works without Gemini.";
}

/**
 * Ordered models for bill OCR + NL.
 * - `GEMINI_MODELS=model-a,model-b` (preferred)
 * - or legacy single `GEMINI_MODEL=model-a` (treated as a one-item list)
 * - else DEFAULT_GEMINI_MODELS
 */
export function getGeminiModels(): string[] {
  const list = process.env.GEMINI_MODELS?.trim();
  if (list) {
    const parsed = list
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parsed.length) return parsed;
  }
  const single = process.env.GEMINI_MODEL?.trim();
  if (single) return [single];
  return [...DEFAULT_GEMINI_MODELS];
}

/** First model in the ordered list (compat helper). */
export function getGeminiModelName(): string {
  return getGeminiModels()[0] ?? DEFAULT_GEMINI_MODEL;
}
