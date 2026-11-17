/** Shared client helpers for Gemini API responses. */

export type GeminiFailure = {
  error: string;
  retryable: boolean;
  modelsTried?: string[];
};

export function parseGeminiFailure(json: unknown, fallback: string): GeminiFailure {
  const body = (json ?? {}) as {
    error?: string;
    retryable?: boolean;
    modelsTried?: string[];
  };
  return {
    error: body.error || fallback,
    retryable: Boolean(body.retryable),
    modelsTried: body.modelsTried,
  };
}
