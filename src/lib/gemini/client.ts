import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import {
  GEMINI_ATTEMPT_TIMEOUT_MS,
  GEMINI_MAX_RETRIES_PER_MODEL,
  getGeminiApiKey,
  getGeminiModels,
  isGeminiConfigured,
  missingGeminiMessage,
} from "@/lib/gemini/config";
import {
  formatGeminiError,
  isRetryableGeminiError,
} from "@/lib/gemini/errors";

export type GeminiGenerateResult = {
  text: string;
  model: string;
  durationMs: number;
  attempts: number;
  modelsTried: string[];
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, ms: number, model: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(
        `Gemini timed out after ${ms}ms (model: ${model}).`
      );
      err.name = "TimeoutError";
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export function requireGeminiClient() {
  if (!isGeminiConfigured()) {
    throw new Error(missingGeminiMessage());
  }
  return new GoogleGenerativeAI(getGeminiApiKey());
}

/** @deprecated Prefer generateContentResilient — kept for rare single-model calls. */
export function requireGemini(modelName?: string) {
  const genAI = requireGeminiClient();
  const model = modelName ?? getGeminiModels()[0];
  return genAI.getGenerativeModel({
    model,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  });
}

/** Strip markdown fences if the model wraps JSON anyway. */
export function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

/**
 * Try each model in order. On 503/429/timeout: up to 2 retries with
 * exponential backoff, then fall through to the next model.
 */
export async function generateContentResilient(
  parts: Part[],
  scope = "gemini"
): Promise<GeminiGenerateResult> {
  const models = getGeminiModels();
  if (!models.length) {
    throw new Error("No Gemini models configured.");
  }

  const genAI = requireGeminiClient();
  const modelsTried: string[] = [];
  let attempts = 0;
  let lastError: unknown;

  for (const modelName of models) {
    modelsTried.push(modelName);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    for (let retry = 0; retry <= GEMINI_MAX_RETRIES_PER_MODEL; retry++) {
      attempts += 1;
      const started = Date.now();
      try {
        const result = await withTimeout(
          model.generateContent(parts),
          GEMINI_ATTEMPT_TIMEOUT_MS,
          modelName
        );
        const text = result.response.text();
        const durationMs = Date.now() - started;
        console.info(
          `[HomeWise ${scope}] model=${modelName} durationMs=${durationMs} ok=true attempt=${attempts}`
        );
        return {
          text,
          model: modelName,
          durationMs,
          attempts,
          modelsTried,
        };
      } catch (error) {
        lastError = error;
        const durationMs = Date.now() - started;
        const retryable = isRetryableGeminiError(error);
        console.warn(
          `[HomeWise ${scope}] model=${modelName} durationMs=${durationMs} ok=false attempt=${attempts} retryable=${retryable} error=${formatGeminiError(error, modelName)}`
        );

        if (!retryable) {
          throw Object.assign(
            new Error(formatGeminiError(error, modelName)),
            { cause: error, model: modelName, modelsTried, attempts }
          );
        }

        if (retry < GEMINI_MAX_RETRIES_PER_MODEL) {
          const backoffMs = 500 * 2 ** retry;
          await sleep(backoffMs);
          continue;
        }
        // Exhausted retries for this model → try next
        break;
      }
    }
  }

  const detail = formatGeminiError(
    lastError,
    modelsTried[modelsTried.length - 1] ?? models[0]
  );
  throw Object.assign(
    new Error(
      `All Gemini models failed after ${attempts} attempt(s) [${modelsTried.join(", ")}]. ${detail}`
    ),
    {
      cause: lastError,
      modelsTried,
      attempts,
      retryable: true,
    }
  );
}
