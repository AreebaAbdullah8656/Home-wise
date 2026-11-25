export type SupportedCurrency =
  | "PKR"
  | "USD"
  | "EUR"
  | "GBP"
  | "AED"
  | "SAR"
  | "INR";

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  "PKR",
  "USD",
  "EUR",
  "GBP",
  "AED",
  "SAR",
  "INR",
];

export type FxQuote = {
  /** 1 base = rate quote */
  base: string;
  quote: string;
  rate: number;
  fetchedAt: string;
  provider: string;
  /** True when serving last cached rate because live fetch failed. */
  stale: boolean;
  warning?: string;
};

export type MoneyContextValue = {
  /** Active display currency (profiles.currency). */
  displayCurrency: string;
  /** Currency stored amounts are in (profiles.amount_currency). */
  amountCurrency: string;
  /** Multiply stored amount by this to get display amount. */
  rateToDisplay: number;
  /** 1 USD = X PKR when both sides involve USD/PKR; else cross via USD. */
  usdToPkr: number | null;
  quote: FxQuote | null;
  warning: string | null;
};
