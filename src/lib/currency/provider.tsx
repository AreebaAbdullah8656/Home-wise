"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { formatMoney } from "@/lib/format";
import { convertAmount } from "@/lib/currency/convert";
import type { MoneyContextValue } from "@/lib/currency/types";

type MoneyApi = MoneyContextValue & {
  format: (amount: number | null | undefined) => string;
  toDisplay: (amount: number | null | undefined) => number;
};

const MoneyContext = createContext<MoneyApi | null>(null);

const DEFAULT: MoneyApi = {
  displayCurrency: "PKR",
  amountCurrency: "PKR",
  rateToDisplay: 1,
  usdToPkr: null,
  quote: null,
  warning: null,
  format: (amount) => formatMoney(Number(amount ?? 0), "PKR"),
  toDisplay: (amount) => Number(amount ?? 0),
};

export function CurrencyProvider({
  value,
  children,
}: {
  value: MoneyContextValue;
  children: ReactNode;
}) {
  const api = useMemo<MoneyApi>(() => {
    const rate = value.rateToDisplay || 1;
    const currency = value.displayCurrency || "PKR";
    return {
      ...value,
      toDisplay: (amount) => convertAmount(Number(amount ?? 0), rate),
      format: (amount) =>
        formatMoney(convertAmount(Number(amount ?? 0), rate), currency),
    };
  }, [value]);

  return (
    <MoneyContext.Provider value={api}>{children}</MoneyContext.Provider>
  );
}

export function useMoney(): MoneyApi {
  return useContext(MoneyContext) ?? DEFAULT;
}
