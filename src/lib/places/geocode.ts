import { getPlacesProvider } from "@/lib/places/config";
import { geocodeWithGoogle } from "@/lib/places/geocode-google";
import { geocodeWithNominatim } from "@/lib/places/osm-nominatim";
import type { GeocodeResult } from "@/lib/places/osm-nominatim";

export type { GeocodeResult };

/** Geocode via active provider (OSM Nominatim default, Google when key set). */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  if (getPlacesProvider() === "google") {
    return geocodeWithGoogle(address);
  }
  return geocodeWithNominatim(address);
}
