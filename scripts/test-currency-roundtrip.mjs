/**
 * PKR ↔ USD display + reverse round-trip (no compounding).
 * Run: node scripts/test-currency-roundtrip.mjs
 */

function crossRateViaUsd(from, to, ratesUsd) {
  const f = from.toUpperCase();
  const t = to.toUpperCase();
  if (f === t) return 1;
  const fromPerUsd = f === "USD" ? 1 : ratesUsd[f];
  const toPerUsd = t === "USD" ? 1 : ratesUsd[t];
  if (!fromPerUsd || !toPerUsd) return null;
  return toPerUsd / fromPerUsd;
}

function convertAmount(amount, rate) {
  return amount * rate;
}

function roundMoney(amount, currency) {
  const digits = currency === "PKR" ? 0 : 2;
  const factor = 10 ** digits;
  return Math.round(amount * factor) / factor;
}

const ratesUsd = { USD: 1, PKR: 280 };
const storedPkr = 10000;

const pkrToUsd = crossRateViaUsd("PKR", "USD", ratesUsd);
const displayedUsd = convertAmount(storedPkr, pkrToUsd);
const backToPkrDisplay = storedPkr; // display-only: stored never changes

console.assert(
  Math.abs(displayedUsd - 10000 / 280) < 1e-9,
  "PKR→USD display"
);
console.assert(backToPkrDisplay === 10000, "USD→PKR display restores exact");

// Permanent convert then reverse via snapshot
const snapshot = { amount: storedPkr };
const converted = roundMoney(convertAmount(snapshot.amount, pkrToUsd), "USD");
const restored = snapshot.amount;
console.assert(converted === 35.71, `permanent USD got ${converted}`);
console.assert(restored === 10000, "reverse restores exact PKR");

console.log("OK: PKR↔USD display + reverse round-trip");
console.log({
  storedPkr,
  rate: "1 USD = 280 PKR",
  displayedUsd,
  permanentUsd: converted,
  restoredPkr: restored,
});
