import type { DeliveryInfo, LivePlace, LatLng } from "@/lib/places/types";

type GooglePlace = {
  id?: string;
  name?: string;
  displayName?: { text?: string; languageCode?: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  types?: string[];
  primaryType?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  location?: { latitude?: number; longitude?: number };
  delivery?: boolean;
  attributions?: Array<{ provider?: string; providerUri?: string }>;
};

function deliveryFromPlace(place: GooglePlace): DeliveryInfo {
  if (typeof place.delivery === "boolean") {
    if (place.delivery) {
      // Places confirms delivery is offered — NOT that it is free.
      return {
        status: "paid_or_unknown_cost",
        label: "Delivery available (cost not verified free)",
        detail:
          "Google Places reports this place offers delivery. Free home delivery was not explicitly confirmed — do not assume it is free.",
      };
    }
    return {
      status: "not_offered",
      label: "Delivery not offered",
      detail: "Google Places reports this place does not offer delivery.",
    };
  }
  return {
    status: "unavailable",
    label: "Delivery information unavailable",
    detail:
      "Delivery could not be verified from Google Places for this location.",
  };
}

export function normalizePlace(
  place: GooglePlace,
  verifiedAt: Date
): LivePlace | null {
  const placeId =
    place.id ||
    (place.name?.startsWith("places/")
      ? place.name.slice("places/".length)
      : null);
  const display = place.displayName?.text?.trim();
  if (!placeId || !display) return null;

  const location: LatLng | null =
    place.location?.latitude != null && place.location?.longitude != null
      ? {
          latitude: place.location.latitude,
          longitude: place.location.longitude,
        }
      : null;

  const attributions = (place.attributions ?? [])
    .map((a) => a.provider?.trim())
    .filter((v): v is string => Boolean(v));

  return {
    placeId,
    name: display,
    address: place.formattedAddress ?? place.shortFormattedAddress ?? null,
    primaryType: place.primaryType ?? null,
    types: place.types ?? [],
    rating: typeof place.rating === "number" ? place.rating : null,
    userRatingCount:
      typeof place.userRatingCount === "number" ? place.userRatingCount : null,
    businessStatus: place.businessStatus ?? null,
    websiteUrl: place.websiteUri ?? null,
    mapsUrl: place.googleMapsUri ?? null,
    phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? null,
    location,
    delivery: deliveryFromPlace(place),
    verifiedProductPrice: null,
    source: "Google Places",
    attributions: attributions.length ? attributions : ["Google Places"],
    lastVerifiedAt: verifiedAt.toISOString(),
  };
}

export const NEARBY_INCLUDED_TYPES = [
  "grocery_store",
  "supermarket",
  "pharmacy",
  "convenience_store",
  "department_store",
  "home_goods_store",
  "hardware_store",
  "drugstore",
] as const;

/** Pro + Enterprise fields. Retry without Atmosphere if needed. */
export const FIELD_MASK_FULL = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.shortFormattedAddress",
  "places.location",
  "places.types",
  "places.primaryType",
  "places.googleMapsUri",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.businessStatus",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.delivery",
  "places.attributions",
].join(",");

/** Without delivery (Atmosphere SKU). */
export const FIELD_MASK_NO_DELIVERY = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.shortFormattedAddress",
  "places.location",
  "places.types",
  "places.primaryType",
  "places.googleMapsUri",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.businessStatus",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.attributions",
].join(",");

/** Essentials/Pro-safe fallback. */
export const FIELD_MASK_BASIC = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.types",
  "places.primaryType",
  "places.googleMapsUri",
  "places.attributions",
].join(",");
