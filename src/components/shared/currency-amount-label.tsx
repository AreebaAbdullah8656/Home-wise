"use client";

import { useMoney } from "@/lib/currency/provider";

/** Label suffix for money inputs — uses active display currency. */
export function CurrencyAmountLabel({ prefix }: { prefix: string }) {
  const { displayCurrency, amountCurrency } = useMoney();
  const code = displayCurrency || amountCurrency || "PKR";
  return (
    <>
      {prefix} ({code})
    </>
  );
}

export function useActiveCurrencyCode(): string {
  const { displayCurrency, amountCurrency } = useMoney();
  return displayCurrency || amountCurrency || "PKR";
}
