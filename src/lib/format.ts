/** Format money for UI. Default currency PKR per SPEC §17. */
export function formatMoney(amount: number, currency = "PKR"): string {
  const code = (currency || "PKR").toUpperCase();
  try {
    return new Intl.NumberFormat(code === "PKR" ? "en-PK" : "en", {
      style: "currency",
      currency: code,
      maximumFractionDigits: code === "PKR" ? 0 : 2,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount);
  }
}

/** Alias used across the app; pass profile currency when available. */
export function formatPkr(amount: number, currency = "PKR"): string {
  return formatMoney(amount, currency);
}
