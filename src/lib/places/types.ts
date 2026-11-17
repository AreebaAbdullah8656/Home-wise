export type LatLng = {
  latitude: number;
  longitude: number;
};

/** Delivery status — never invent free delivery. */
export type DeliveryInfo =
  | {
      status: "free";
      label: "Free home delivery";
      detail: string;
    }
  | {
      status: "paid_or_unknown_cost";
      label: "Delivery available (cost not verified free)";
      detail: string;
    }
  | {
      status: "not_offered";
      label: "Delivery not offered";
      detail: string;
    }
  | {
      status: "unavailable";
      label: "Delivery information unavailable";
      detail: string;
    };

export type LivePlace = {
  placeId: string;
  name: string;
  address: string | null;
  primaryType: string | null;
  types: string[];
  rating: number | null;
  userRatingCount: number | null;
  businessStatus: string | null;
  websiteUrl: string | null;
  mapsUrl: string | null;
  phone: string | null;
  location: LatLng | null;
  delivery: DeliveryInfo;
  /** Product prices are not provided by Places — always null here. */
  verifiedProductPrice: null;
  source: "Google Places";
  attributions: string[];
  lastVerifiedAt: string;
};

export type LivePlacesResult = {
  ok: true;
  places: LivePlace[];
  center: LatLng;
  radiusMeters: number;
  locationSource: "device" | "profile" | "query";
  locationLabel: string | null;
  lastVerifiedAt: string;
  cached: boolean;
  cacheExpiresAt: string | null;
};

export type LivePlacesError = {
  ok: false;
  code:
    | "missing_api_key"
    | "missing_location"
    | "geocode_failed"
    | "places_failed"
    | "invalid_coordinates";
  message: string;
  lastVerifiedAt: string;
};

export type LivePlacesResponse = LivePlacesResult | LivePlacesError;
