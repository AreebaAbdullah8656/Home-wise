import "server-only";

import { getServerMoney } from "@/lib/currency/server";
import { roundMoney } from "@/lib/currency/convert";

/**
 * Convert a user-entered amount from active display currency into the
 * stored amount_currency. Display-only currency changes stay reversible:
 * entries are normalized to the stored unit using the live/cached rate.
 */
export async function displayInputToStored(
  displayAmount: number
): Promise<number> {
  const money = await getServerMoney();
  const amount = Number(displayAmount);
  if (!Number.isFinite(amount)) return 0;
  if (money.displayCurrency === money.amountCurrency) {
    return roundMoney(amount, money.amountCurrency);
  }
  if (!money.rateToDisplay || money.rateToDisplay <= 0) {
    // No rate — refuse inventing; keep as entered (caller may surface warning).
    return roundMoney(amount, money.amountCurrency);
  }
  return roundMoney(amount / money.rateToDisplay, money.amountCurrency);
}

export async function getActiveCurrencyForAi(): Promise<string> {
  const money = await getServerMoney();
  return money.displayCurrency || money.amountCurrency || "PKR";
}
