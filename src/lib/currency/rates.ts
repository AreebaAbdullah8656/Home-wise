import "server-only";

import { createClient } from "@/lib/supabase/server";
import { crossRateViaUsd } from "@/lib/currency/convert";
import type { FxQuote } from "@/lib/currency/types";

/** Cache TTL — refresh live rates only when older than this. */
export const FX_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

const PROVIDER = "open.er-api.com";
const LIVE_URL = "https://open.er-api.com/v6/latest/USD";

type LiveUsdPayload = {
  result?: string;
  base_code?: string;
  rates?: Record<string, number>;
  time_last_update_utc?: string;
};

async function readCachedUsdBundle(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ rates: Record<string, number>; fetchedAt: string } | null> {
  const { data, error } = await supabase
    .from("fx_rates")
    .select("quote_currency, rate, fetched_at")
    .eq("base_currency", "USD");

  if (error || !data?.length) return null;

  const rates: Record<string, number> = { USD: 1 };
  let fetchedAt = data[0].fetched_at;
  for (const row of data) {
    rates[row.quote_currency.toUpperCase()] = Number(row.rate);
    if (row.fetched_at > fetchedAt) fetchedAt = row.fetched_at;
  }
  return { rates, fetchedAt };
}

async function writeUsdBundle(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rates: Record<string, number>,
  fetchedAt: string
) {
  const rows = Object.entries(rates)
    .filter(([code, rate]) => code && Number.isFinite(rate) && rate > 0)
    .map(([quote, rate]) => ({
      base_currency: "USD",
      quote_currency: quote.toUpperCase(),
      rate,
      provider: PROVIDER,
      fetched_at: fetchedAt,
    }));

  if (!rows.length) return;

  // Upsert in chunks to stay under payload limits.
  const chunkSize = 80;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from("fx_rates").upsert(chunk, {
      onConflict: "base_currency,quote_currency",
    });
    if (error) {
      console.error("[HomeWise fx] cache write failed", error.message);
      break;
    }
  }
}

async function fetchLiveUsdRates(): Promise<{
  rates: Record<string, number>;
  fetchedAt: string;
} | null> {
  try {
    const res = await fetch(LIVE_URL, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.error("[HomeWise fx] live fetch HTTP", res.status);
      return null;
    }
    const json = (await res.json()) as LiveUsdPayload;
    if (json.result !== "success" || !json.rates) return null;
    const rates: Record<string, number> = { USD: 1 };
    for (const [code, rate] of Object.entries(json.rates)) {
      if (Number.isFinite(rate) && rate > 0) {
        rates[code.toUpperCase()] = rate;
      }
    }
    const fetchedAt = new Date().toISOString();
    return { rates, fetchedAt };
  } catch (error) {
    console.error("[HomeWise fx] live fetch failed", error);
    return null;
  }
}

/**
 * Ensure USD→* rates are available. Uses cache if fresh (≥12h TTL).
 * On live failure, returns last cached rates with a warning — never invents.
 */
export async function getUsdRateBundle(): Promise<{
  rates: Record<string, number>;
  fetchedAt: string;
  provider: string;
  stale: boolean;
  warning?: string;
} | null> {
  const supabase = await createClient();
  const cached = await readCachedUsdBundle(supabase);
  const now = Date.now();
  const cacheFresh =
    cached &&
    now - new Date(cached.fetchedAt).getTime() < FX_CACHE_TTL_MS;

  if (cacheFresh && cached) {
    return {
      rates: cached.rates,
      fetchedAt: cached.fetchedAt,
      provider: PROVIDER,
      stale: false,
    };
  }

  const live = await fetchLiveUsdRates();
  if (live) {
    await writeUsdBundle(supabase, live.rates, live.fetchedAt);
    return {
      rates: live.rates,
      fetchedAt: live.fetchedAt,
      provider: PROVIDER,
      stale: false,
    };
  }

  if (cached) {
    return {
      rates: cached.rates,
      fetchedAt: cached.fetchedAt,
      provider: PROVIDER,
      stale: true,
      warning:
        "Live exchange rate unavailable. Showing last cached rate. Amounts may be slightly outdated.",
    };
  }

  return null;
}

/** Quote 1 fromCurrency = rate toCurrency. Never invents a rate. */
export async function getFxQuote(
  fromCurrency: string,
  toCurrency: string
): Promise<FxQuote | null> {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();
  if (from === to) {
    return {
      base: from,
      quote: to,
      rate: 1,
      fetchedAt: new Date().toISOString(),
      provider: "identity",
      stale: false,
    };
  }

  const bundle = await getUsdRateBundle();
  if (!bundle) return null;

  const rate = crossRateViaUsd(from, to, bundle.rates);
  if (rate == null) return null;

  return {
    base: from,
    quote: to,
    rate,
    fetchedAt: bundle.fetchedAt,
    provider: bundle.provider,
    stale: bundle.stale,
    warning: bundle.warning,
  };
}
