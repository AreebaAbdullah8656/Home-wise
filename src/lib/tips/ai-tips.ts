import { cache } from "react";
import { connection } from "next/server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isGeminiConfigured } from "@/lib/gemini/config";
import { generateSavingTipsWithGemini } from "@/lib/gemini/generate-saving-tips";
import { getHouseholdTipAggregates } from "@/lib/tips/aggregates";
import {
  TIP_CATEGORIES,
  type Tip,
  type TipCategory,
} from "@/lib/tips/catalog";

export const AI_TIPS_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const AI_TIPS_MAX_REFRESH_PER_DAY = 3;

export type AiTipsCacheStatus = {
  tips: Tip[];
  generatedAt: string | null;
  model: string | null;
  refreshCountToday: number;
  refreshRemainingToday: number;
  stale: boolean;
  notice: string | null;
};

type CachedTipJson = {
  key?: string;
  category?: string;
  title?: string;
  body?: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function isTipCategory(value: string): value is TipCategory {
  return (TIP_CATEGORIES as string[]).includes(value);
}

function normalizeCachedTips(raw: unknown): Tip[] {
  if (!Array.isArray(raw)) return [];
  const out: Tip[] = [];
  for (const item of raw as CachedTipJson[]) {
    const title = String(item?.title ?? "").trim();
    const body = String(item?.body ?? "").trim();
    const categoryRaw = String(item?.category ?? "").trim();
    if (!title || !body || !isTipCategory(categoryRaw)) continue;
    const key =
      String(item?.key ?? "").trim() ||
      `ai-${categoryRaw.toLowerCase()}-${slugify(title)}`;
    out.push({
      key,
      category: categoryRaw,
      title,
      body,
      source: "ai",
    });
  }
  return out;
}

function utcDateString(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

async function requireUserId() {
  await connection();
  if (!isSupabaseConfigured()) return null;
  const user = await getSessionUser();
  return user?.id ?? null;
}

function emptyStatus(notice: string | null = null): AiTipsCacheStatus {
  return {
    tips: [],
    generatedAt: null,
    model: null,
    refreshCountToday: 0,
    refreshRemainingToday: AI_TIPS_MAX_REFRESH_PER_DAY,
    stale: true,
    notice,
  };
}

async function readCacheRow(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_saving_tips_cache")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    // Table may not exist until migration is applied.
    console.warn("[ai-tips] cache read failed:", error.message);
    return { ok: false as const, missingTable: true };
  }
  return { ok: true as const, row: data };
}

function statusFromRow(
  row: {
    tips: unknown;
    generated_at: string;
    model: string | null;
    refresh_count: number;
    refresh_window_start: string;
  } | null,
  notice: string | null = null
): AiTipsCacheStatus {
  if (!row) return emptyStatus(notice);
  const today = utcDateString();
  const windowStart = String(row.refresh_window_start).slice(0, 10);
  const refreshCountToday =
    windowStart === today ? Number(row.refresh_count) || 0 : 0;
  const generatedAt = row.generated_at;
  const ageMs = Date.now() - new Date(generatedAt).getTime();
  return {
    tips: normalizeCachedTips(row.tips),
    generatedAt,
    model: row.model,
    refreshCountToday,
    refreshRemainingToday: Math.max(
      0,
      AI_TIPS_MAX_REFRESH_PER_DAY - refreshCountToday
    ),
    stale: !Number.isFinite(ageMs) || ageMs >= AI_TIPS_WEEK_MS,
    notice,
  };
}

async function writeCache(input: {
  userId: string;
  tips: Tip[];
  model: string | null;
  bumpRefresh: boolean;
  previous?: {
    refresh_count: number;
    refresh_window_start: string;
  } | null;
}) {
  const supabase = await createClient();
  const today = utcDateString();
  let refreshCount = 0;
  let refreshWindowStart = today;
  if (input.bumpRefresh) {
    const prevWindow = input.previous?.refresh_window_start
      ? String(input.previous.refresh_window_start).slice(0, 10)
      : "";
    refreshCount =
      prevWindow === today ? (Number(input.previous?.refresh_count) || 0) + 1 : 1;
    refreshWindowStart = today;
  } else if (input.previous) {
    const prevWindow = String(input.previous.refresh_window_start).slice(0, 10);
    if (prevWindow === today) {
      refreshCount = Number(input.previous.refresh_count) || 0;
      refreshWindowStart = today;
    }
  }

  const payload = {
    user_id: input.userId,
    tips: input.tips.map((t) => ({
      key: t.key,
      category: t.category,
      title: t.title,
      body: t.body,
    })),
    generated_at: new Date().toISOString(),
    model: input.model,
    refresh_count: refreshCount,
    refresh_window_start: refreshWindowStart,
  };

  const { error } = await supabase.from("ai_saving_tips_cache").upsert(payload, {
    onConflict: "user_id",
  });
  if (error) {
    console.warn("[ai-tips] cache write failed:", error.message);
    throw error;
  }
}

async function generateAndStore(opts: {
  userId: string;
  bumpRefresh: boolean;
  previous: {
    refresh_count: number;
    refresh_window_start: string;
    tips: unknown;
    generated_at: string;
    model: string | null;
  } | null;
}): Promise<AiTipsCacheStatus> {
  if (!isGeminiConfigured()) {
    return statusFromRow(opts.previous, "Personalized tips need GEMINI_API_KEY on the server.");
  }

  const aggregates = await getHouseholdTipAggregates();
  if (!aggregates) {
    return statusFromRow(opts.previous, "Sign in to get personalized tips.");
  }

  try {
    const generated = await generateSavingTipsWithGemini(aggregates);
    const tips: Tip[] = generated.tips.map((tip) => ({
      key: `ai-${tip.category.toLowerCase()}-${slugify(tip.title)}`,
      category: tip.category,
      title: tip.title,
      body: tip.body,
      source: "ai",
    }));
    await writeCache({
      userId: opts.userId,
      tips,
      model: generated.meta.model,
      bumpRefresh: opts.bumpRefresh,
      previous: opts.previous,
    });
    const reread = await readCacheRow(opts.userId);
    if (reread.ok && reread.row) {
      return statusFromRow(reread.row, null);
    }
    return {
      tips,
      generatedAt: new Date().toISOString(),
      model: generated.meta.model,
      refreshCountToday: opts.bumpRefresh
        ? (opts.previous &&
          String(opts.previous.refresh_window_start).slice(0, 10) ===
            utcDateString()
            ? (Number(opts.previous.refresh_count) || 0) + 1
            : 1)
        : 0,
      refreshRemainingToday: AI_TIPS_MAX_REFRESH_PER_DAY,
      stale: false,
      notice: null,
    };
  } catch (error) {
    console.warn(
      "[ai-tips] generation failed:",
      error instanceof Error ? error.message : error
    );
    return statusFromRow(
      opts.previous,
      "Personalized tips are temporarily unavailable. Showing curated tips instead."
    );
  }
}

/**
 * Load AI tips for the tips page.
 * Uses cache; auto-regenerates at most once per week when stale.
 * Never calls Gemini on every load when cache is fresh.
 */
export const getAiSavingTipsForPage = cache(
  async (): Promise<AiTipsCacheStatus> => {
    const userId = await requireUserId();
    if (!userId) {
      return emptyStatus(null);
    }

    const cached = await readCacheRow(userId);
    if (!cached.ok) {
      return emptyStatus(
        "Personalized tips need the AI tips migration in Supabase. Showing curated tips."
      );
    }

    const status = statusFromRow(cached.row);
    if (status.tips.length && !status.stale) {
      return status;
    }

    // First visit (empty cache): do not block SSR on Gemini — curated tips
    // render immediately; user taps Refresh tips for personalized AI tips.
    if (!status.tips.length) {
      return emptyStatus(
        isGeminiConfigured()
          ? "Tap Refresh tips for personalized AI tips (uses your spending patterns)."
          : "GEMINI_API_KEY is not set — showing curated tips only."
      );
    }

    // Weekly auto-refresh when cache exists but is stale.
    return generateAndStore({
      userId,
      bumpRefresh: false,
      previous: cached.row,
    });
  }
);

export async function refreshAiSavingTips(): Promise<{
  ok: boolean;
  message: string;
  status?: AiTipsCacheStatus;
}> {
  const userId = await requireUserId();
  if (!userId) {
    return { ok: false, message: "Sign in to refresh personalized tips." };
  }
  if (!isGeminiConfigured()) {
    return {
      ok: false,
      message: "Personalized tips need GEMINI_API_KEY on the server.",
    };
  }

  const cached = await readCacheRow(userId);
  if (!cached.ok) {
    return {
      ok: false,
      message:
        "Personalized tips need the AI tips migration in Supabase SQL Editor first.",
    };
  }

  const current = statusFromRow(cached.row);
  if (current.refreshRemainingToday <= 0) {
    return {
      ok: false,
      message: `Refresh limit reached (${AI_TIPS_MAX_REFRESH_PER_DAY}/day). Try again tomorrow.`,
      status: current,
    };
  }

  const next = await generateAndStore({
    userId,
    bumpRefresh: true,
    previous: cached.row,
  });

  if (next.notice && next.tips.length === 0) {
    return { ok: false, message: next.notice, status: next };
  }

  return {
    ok: true,
    message: "Personalized tips refreshed.",
    status: next,
  };
}
