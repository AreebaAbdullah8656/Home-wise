/** Server-only Gemini config. Never import from client components. */

/** Single default used by bill scan + NL expense when GEMINI_MODEL is unset. */
export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

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
 * Multimodal model for OCR + NL (image + PDF supported on gemini-3.8-flash).
 * Override with GEMINI_MODEL in .env.local if needed.
 */
export function getGeminiModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}
