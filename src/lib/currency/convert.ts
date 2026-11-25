/** Convert an amount between currencies using a rate where 1 from = rate to. */
export function convertAmount(
  amount: number,
  rateFromTo: number
): number {
  if (!Number.isFinite(amount) || !Number.isFinite(rateFromTo)) return 0;
  return amount * rateFromTo;
}

/**
 * Build a cross rate 1 from → to using USD-based quotes.
 * ratesUsd[C] = how many C per 1 USD.
 */
export function crossRateViaUsd(
  from: string,
  to: string,
  ratesUsd: Record<string, number>
): number | null {
  const f = from.toUpperCase();
  const t = to.toUpperCase();
  if (f === t) return 1;

  const fromPerUsd = f === "USD" ? 1 : ratesUsd[f];
  const toPerUsd = t === "USD" ? 1 : ratesUsd[t];
  if (
    fromPerUsd == null ||
    toPerUsd == null ||
    !Number.isFinite(fromPerUsd) ||
    !Number.isFinite(toPerUsd) ||
    fromPerUsd <= 0 ||
    toPerUsd <= 0
  ) {
    return null;
  }

  // 1 from = (1/fromPerUsd) USD = toPerUsd/fromPerUsd of `to`
  return toPerUsd / fromPerUsd;
}

/** Round money for storage after permanent convert (2 dp). */
export function roundMoney(amount: number, currency: string): number {
  const code = currency.toUpperCase();
  const digits = code === "PKR" || code === "JPY" || code === "KRW" ? 0 : 2;
  const factor = 10 ** digits;
  return Math.round(amount * factor) / factor;
}
