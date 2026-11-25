import "server-only";

import { cache } from "react";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getFxQuote, getUsdRateBundle } from "@/lib/currency/rates";
import type { MoneyContextValue } from "@/lib/currency/types";
import { formatMoney } from "@/lib/format";
import { convertAmount } from "@/lib/currency/convert";

export type ServerMoney = MoneyContextValue & {
  /** Convert stored amount → display currency and format. */
  format: (amount: number | null | undefined) => string;
  /** Convert stored amount → display number (unformatted). */
  toDisplay: (amount: number | null | undefined) => number;
};

const EMPTY: ServerMoney = {
  displayCurrency: "PKR",
  amountCurrency: "PKR",
  rateToDisplay: 1,
  usdToPkr: null,
  quote: null,
  warning: null,
  format: (amount) => formatMoney(Number(amount ?? 0), "PKR"),
  toDisplay: (amount) => Number(amount ?? 0),
};

/** Request-deduped money context for the signed-in user. */
export const getServerMoney = cache(async (): Promise<ServerMoney> => {
  if (!isSupabaseConfigured()) return EMPTY;

  const user = await getSessionUser();
  if (!user) return EMPTY;

  const supabase = await createClient();
  let profile: { currency?: string; amount_currency?: string } | null = null;
  {
    const withAmount = await supabase
      .from("profiles")
      .select("currency, amount_currency")
      .eq("id", user.id)
      .maybeSingle();
    if (withAmount.error) {
      const legacy = await supabase
        .from("profiles")
        .select("currency")
        .eq("id", user.id)
        .maybeSingle();
      profile = legacy.data;
    } else {
      profile = withAmount.data;
    }
  }

  const displayCurrency = (profile?.currency || "PKR").toUpperCase();
  const amountCurrency = (
    profile?.amount_currency ||
    displayCurrency ||
    "PKR"
  ).toUpperCase();

  let rateToDisplay = 1;
  let quote = null as ServerMoney["quote"];
  let warning: string | null = null;
  let usdToPkr: number | null = null;

  const bundle = await getUsdRateBundle().catch(() => null);
  if (bundle?.rates?.PKR) {
    usdToPkr = bundle.rates.PKR;
  }

  if (displayCurrency !== amountCurrency) {
    quote = await getFxQuote(amountCurrency, displayCurrency);
    if (!quote) {
      warning =
        "Exchange rate unavailable. Showing amounts in their stored currency until a rate is cached.";
      return {
        displayCurrency: amountCurrency,
        amountCurrency,
        rateToDisplay: 1,
        usdToPkr,
        quote: null,
        warning,
        format: (amount) => formatMoney(Number(amount ?? 0), amountCurrency),
        toDisplay: (amount) => Number(amount ?? 0),
      };
    }
    rateToDisplay = quote.rate;
    if (quote.warning) warning = quote.warning;
  } else if (bundle?.warning) {
    warning = bundle.warning;
    quote = {
      base: "USD",
      quote: "PKR",
      rate: usdToPkr ?? 1,
      fetchedAt: bundle.fetchedAt,
      provider: bundle.provider,
      stale: bundle.stale,
      warning: bundle.warning,
    };
  } else if (bundle && usdToPkr != null) {
    quote = {
      base: "USD",
      quote: "PKR",
      rate: usdToPkr,
      fetchedAt: bundle.fetchedAt,
      provider: bundle.provider,
      stale: false,
    };
  }

  return {
    displayCurrency,
    amountCurrency,
    rateToDisplay,
    usdToPkr,
    quote,
    warning,
    toDisplay: (amount) =>
      convertAmount(Number(amount ?? 0), rateToDisplay),
    format: (amount) =>
      formatMoney(
        convertAmount(Number(amount ?? 0), rateToDisplay),
        displayCurrency
      ),
  };
});
