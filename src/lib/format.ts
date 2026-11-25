/** Locale + fraction digits for common HomeWise currencies. */
function formatOptions(currency: string): {
  locale: string;
  maximumFractionDigits: number;
  minimumFractionDigits: number;
} {
  const code = (currency || "PKR").toUpperCase();
  switch (code) {
    case "PKR":
      return {
        locale: "en-PK",
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      };
    case "JPY":
    case "KRW":
      return {
        locale: "en",
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      };
    case "USD":
      return {
        locale: "en-US",
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      };
    case "EUR":
      return {
        locale: "en-IE",
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      };
    case "GBP":
      return {
        locale: "en-GB",
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      };
    case "AED":
    case "SAR":
      return {
        locale: "en",
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      };
    case "INR":
      return {
        locale: "en-IN",
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      };
    default:
      return {
        locale: "en",
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      };
  }
}

/** Format money for UI. Default currency PKR per SPEC §17. */
export function formatMoney(amount: number, currency = "PKR"): string {
  const code = (currency || "PKR").toUpperCase();
  const opts = formatOptions(code);
  try {
    return new Intl.NumberFormat(opts.locale, {
      style: "currency",
      currency: code,
      maximumFractionDigits: opts.maximumFractionDigits,
      minimumFractionDigits: opts.minimumFractionDigits,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount);
  }
}

/**
 * Legacy alias — prefer useMoney().format / getServerMoney().format so
 * amounts convert from amount_currency → display currency.
 */
export function formatPkr(amount: number, currency = "PKR"): string {
  return formatMoney(amount, currency);
}

/** Human-readable relative time for FX "updated …" labels. */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "unknown";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "unknown";
  const deltaSec = Math.round((Date.now() - then) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const abs = Math.abs(deltaSec);
  if (abs < 60) return rtf.format(-deltaSec, "second");
  if (abs < 3600) return rtf.format(-Math.round(deltaSec / 60), "minute");
  if (abs < 86400) return rtf.format(-Math.round(deltaSec / 3600), "hour");
  return rtf.format(-Math.round(deltaSec / 86400), "day");
}
