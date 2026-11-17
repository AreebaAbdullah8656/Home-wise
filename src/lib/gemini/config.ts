/** Server-only Gemini config. Never import from client components. */

export function getGeminiApiKey(): string {
  return process.env.GEMINI_API_KEY?.trim() ?? "";
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

export function missingGeminiMessage(): string {
  return "GEMINI_API_KEY is not set. Add it to .env.local (server-only) and restart the app. Manual expense entry still works without Gemini.";
}

/** Prefer a current multimodal model; override with GEMINI_MODEL if needed. */
export function getGeminiModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
}
