import { getGeminiModelName } from "@/lib/gemini/config";

/**
 * Prefer the real Gemini / Google Generative AI error text for the UI.
 * Falls back to a short message when the error shape is unknown.
 */
export function formatGeminiError(error: unknown): string {
  const model = getGeminiModelName();

  if (error && typeof error === "object") {
    const err = error as {
      message?: string;
      status?: number | string;
      statusText?: string;
      errorDetails?: unknown;
      cause?: unknown;
    };

    const message = String(err.message ?? "").trim();
    if (message) {
      // Keep model name visible when API returns 404/not available.
      if (!/models\//i.test(message) && !message.includes(model)) {
        return `${message} (model: ${model})`;
      }
      return message;
    }

    if (err.status != null) {
      return `Gemini request failed with status ${err.status}${
        err.statusText ? ` ${err.statusText}` : ""
      } (model: ${model}).`;
    }
  }

  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  return `Gemini request failed (model: ${model}).`;
}

export function isGeminiApiError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { name?: string; message?: string; status?: unknown };
  if (err.name === "GoogleGenerativeAIError") return true;
  const msg = String(err.message ?? "");
  return (
    /GoogleGenerativeAI|generativelanguage\.googleapis|models\/gemini/i.test(
      msg
    ) || typeof err.status === "number"
  );
}
