import { Suspense, type ReactNode } from "react";
import { CurrencyProvider } from "@/lib/currency/provider";
import { getServerMoney } from "@/lib/currency/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

async function CurrencyChromeInner({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <CurrencyProvider
        value={{
          displayCurrency: "PKR",
          amountCurrency: "PKR",
          rateToDisplay: 1,
          usdToPkr: null,
          quote: null,
          warning: null,
        }}
      >
        {children}
      </CurrencyProvider>
    );
  }

  const money = await getServerMoney();
  return (
    <CurrencyProvider
      value={{
        displayCurrency: money.displayCurrency,
        amountCurrency: money.amountCurrency,
        rateToDisplay: money.rateToDisplay,
        usdToPkr: money.usdToPkr,
        quote: money.quote,
        warning: money.warning,
      }}
    >
      {money.warning ? (
        <div
          className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100"
          role="status"
        >
          {money.warning}
        </div>
      ) : null}
      {children}
    </CurrencyProvider>
  );
}

function CurrencyChromeFallback({ children }: { children: ReactNode }) {
  return (
    <CurrencyProvider
      value={{
        displayCurrency: "PKR",
        amountCurrency: "PKR",
        rateToDisplay: 1,
        usdToPkr: null,
        quote: null,
        warning: null,
      }}
    >
      {children}
    </CurrencyProvider>
  );
}

/** Wraps app main content with FX-aware formatting (Suspense-safe). */
export function CurrencyChrome({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<CurrencyChromeFallback>{children}</CurrencyChromeFallback>}>
      <CurrencyChromeInner>{children}</CurrencyChromeInner>
    </Suspense>
  );
}
