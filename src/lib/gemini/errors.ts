import { getGeminiModelName } from "@/lib/gemini/config";

/**
 * Prefer the real Gemini / Google Generative AI error text for the UI.
 * Falls back to a short message when the error shape is unknown.
 */
export function formatGeminiError(
  error: unknown,
  model = getGeminiModelName()
): string {
  if (error && typeof error === "object") {
    const err = error as {
      message?: string;
      status?: number | string;
      statusText?: string;
    };

    const message = String(err.message ?? "").trim();
    if (message) {
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

export function getGeminiErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const err = error as { status?: number | string; message?: string };
  if (typeof err.status === "number") return err.status;
  if (typeof err.status === "string" && /^\d+$/.test(err.status)) {
    return Number(err.status);
  }
  const msg = String(err.message ?? "");
  const m = msg.match(/\[(\d{3})\s/);
  if (m) return Number(m[1]);
  return null;
}

function geminiErrorMessage(error: unknown): string {
  return String(
    error && typeof error === "object" && "message" in error
      ? (error as { message?: string }).message
      : error ?? ""
  );
}

/**
 * Daily / hard per-model quota — retrying the same model is useless.
 * Caller should fall through to the next model immediately.
 */
export function isGeminiModelQuotaExhausted(error: unknown): boolean {
  const msg = geminiErrorMessage(error);
  return /GenerateRequestsPerDay|requests per day limit exceeded|Quota exceeded for metric:.*generate_content_free_tier|limit: 20, model:/i.test(
    msg
  );
}

/** True for capacity / rate-limit / timeout — safe to retry or fall back. */
export function isRetryableGeminiError(error: unknown): boolean {
  if (error && typeof error === "object") {
    const name = String((error as { name?: string }).name ?? "");
    if (name === "AbortError" || name === "TimeoutError") return true;
  }
  // Daily quota is "retryable" only in the sense of trying another model —
  // not for sleeping and hitting the same model again.
  if (isGeminiModelQuotaExhausted(error)) return true;
  const status = getGeminiErrorStatus(error);
  if (status === 429 || status === 503 || status === 500 || status === 504) {
    return true;
  }
  const msg = geminiErrorMessage(error);
  return /503|429|high demand|Service Unavailable|RESOURCE_EXHAUSTED|UNAVAILABLE|timeout|ETIMEDOUT|AbortError|timed out/i.test(
    msg
  );
}
