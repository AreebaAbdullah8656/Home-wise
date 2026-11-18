/** Simple sequential delay for Nominatim (max ~1 req/s policy). */

let nominatimChain: Promise<void> = Promise.resolve();
let lastNominatimAt = 0;

const MIN_INTERVAL_MS = 1100;

export function withNominatimRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  const run = nominatimChain.then(async () => {
    const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastNominatimAt));
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    lastNominatimAt = Date.now();
    return fn();
  });
  nominatimChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}
