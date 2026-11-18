export type LatLng = {
  latitude: number;
  longitude: number;
};

export type PlaceSource = "OpenStreetMap" | "Google Places";

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
  /** Distance from the active search center, when known. */
  distanceMeters: number | null;
  delivery: DeliveryInfo;
  /** Product prices are never invented — always null from OSM/Places. */
  verifiedProductPrice: null;
  source: PlaceSource;
  attributions: string[];
  lastVerifiedAt: string;
};

export type LocationSource = "saved" | "device" | "profile" | "query";

export type LivePlacesResult = {
  ok: true;
  places: LivePlace[];
  center: LatLng;
  radiusMeters: number;
  locationSource: LocationSource;
  locationLabel: string | null;
  provider: "osm" | "google";
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
  /** Upstream HTTP status when known (e.g. Nominatim 403). */
  httpStatus?: number;
  provider: "osm" | "google";
  lastVerifiedAt: string;
};

export type LivePlacesResponse = LivePlacesResult | LivePlacesError;
