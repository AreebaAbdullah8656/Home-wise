import type { LivePlace } from "@/lib/places/types";

export function partitionLivePlaces(places: LivePlace[]) {
  const nearby = [...places];
  const bestLocal = [...places]
    .filter((p) => p.rating != null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  const freeDelivery = places.filter((p) => p.delivery.status === "free");
  const verifiedOnline = places.filter((p) => Boolean(p.websiteUrl));
  /** Product prices are never invented — always empty from Places. */
  const lowestVerifiedPrice: LivePlace[] = [];

  return {
    nearby,
    bestLocal,
    freeDelivery,
    verifiedOnline,
    lowestVerifiedPrice,
  };
}
