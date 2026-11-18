"use client";

import { useCallback, useEffect, useMemo, useState, useActionState } from "react";
import {
  removeSavedRecommendation,
  saveSearchLocation,
  type ActionState,
} from "@/app/recommendations/actions";
import { PlaceCard } from "@/components/recommendations/place-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  LivePlace,
  LivePlacesResponse,
  LocationSource,
} from "@/lib/places/types";
import type {
  BillPlaceMatch,
  PlaceRecommendationPayload,
  ProfileSearchLocation,
  SavedRecommendationRow,
} from "@/lib/recommendations/queries";
import { hasUsablePlaceName } from "@/lib/places/maps-search";
import { buildOnlineStoreLinks } from "@/lib/places/online-stores";
import {
  DEFAULT_RADIUS_KM,
  normalizeRadiusKm,
  RADIUS_KM_OPTIONS,
  type RadiusKm,
} from "@/lib/places/distance";
import { assertInPakistan } from "@/lib/places/pakistan";

const NEARBY_UNAVAILABLE =
  "Nearby shops could not be loaded right now. Try again in a minute.";

const initial: ActionState = {};
const STORAGE_KEY = "homewise:search-location-v1";

type SectionId = "nearby" | "online" | "from-bills" | "saved";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "nearby", label: "Nearby Stores" },
  { id: "online", label: "Online Stores" },
  { id: "from-bills", label: "From your bills" },
  { id: "saved", label: "Saved" },
];

type LiveApiOk = {
  ok: true;
  places: LivePlace[];
  lastVerifiedAt: string;
  cached: boolean;
  cacheExpiresAt: string | null;
  locationSource: LocationSource;
  locationLabel: string | null;
  center: { latitude: number; longitude: number };
  radiusMeters: number;
  radiusKm?: number;
  provider?: "osm" | "google";
  sections: {
    nearbyStores: LivePlace[];
    bestLocalOptions: LivePlace[];
    freeHomeDelivery: LivePlace[];
    verifiedOnlineStores: LivePlace[];
    lowestAvailablePrice: LivePlace[];
  };
};

type LiveApiErr = {
  ok: false;
  code?: string;
  message: string;
  httpStatus?: number;
  lastVerifiedAt?: string;
  provider?: "osm" | "google";
};

type SavedCenter = {
  latitude: number;
  longitude: number;
  label: string;
};

type DiscoveryPanelProps = {
  provider: "osm" | "google";
  providerLabel: string;
  providerHint?: string;
  signedIn: boolean;
  profileLocation: ProfileSearchLocation;
  initialLive: LivePlacesResponse;
  saved: SavedRecommendationRow[];
  savedKeys: string[];
  dismissedKeys: string[];
  billMatches: BillPlaceMatch[];
};

function readLocalSaved(): SavedCenter | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedCenter;
    if (
      typeof parsed?.latitude !== "number" ||
      typeof parsed?.longitude !== "number"
    ) {
      return null;
    }
    const inPk = assertInPakistan({
      latitude: parsed.latitude,
      longitude: parsed.longitude,
    });
    if (!inPk.ok) return null;
    return {
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      label: typeof parsed.label === "string" ? parsed.label : "",
    };
  } catch {
    return null;
  }
}

function writeLocalSaved(center: SavedCenter) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(center));
}

export function DiscoveryPanel({
  provider,
  providerLabel,
  providerHint,
  signedIn,
  profileLocation,
  initialLive,
  saved,
  savedKeys,
  dismissedKeys,
  billMatches,
}: DiscoveryPanelProps) {
  const [section, setSection] = useState<SectionId>("nearby");
  const [query, setQuery] = useState("");
  const [radiusKm, setRadiusKm] = useState<RadiusKm>(DEFAULT_RADIUS_KM);
  const [areaText, setAreaText] = useState(profileLocation.label ?? "");
  const [activeCenter, setActiveCenter] = useState<SavedCenter | null>(() => {
    if (
      profileLocation.latitude != null &&
      profileLocation.longitude != null
    ) {
      return {
        latitude: profileLocation.latitude,
        longitude: profileLocation.longitude,
        label: profileLocation.label ?? "Saved area",
      };
    }
    return null;
  });
  const [locationSource, setLocationSource] = useState<LocationSource | null>(
    activeCenter ? "saved" : null
  );
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [live, setLive] = useState<LiveApiOk | LiveApiErr | null>(() => {
    if (!initialLive.ok) return initialLive;
    return {
      ok: true,
      places: initialLive.places,
      lastVerifiedAt: initialLive.lastVerifiedAt,
      cached: initialLive.cached,
      cacheExpiresAt: initialLive.cacheExpiresAt,
      locationSource: initialLive.locationSource,
      locationLabel: initialLive.locationLabel,
      center: initialLive.center,
      radiusMeters: initialLive.radiusMeters,
      radiusKm: normalizeRadiusKm(initialLive.radiusMeters / 1000),
      provider: initialLive.provider,
      sections: {
        nearbyStores: initialLive.places,
        bestLocalOptions: [],
        freeHomeDelivery: [],
        verifiedOnlineStores: [],
        lowestAvailablePrice: [],
      },
    };
  });
  const [loading, setLoading] = useState(false);
  const [removeState, removeAction, removePending] = useActionState(
    removeSavedRecommendation,
    initial
  );

  const savedSet = useMemo(() => new Set(savedKeys), [savedKeys]);
  const dismissedSet = useMemo(() => new Set(dismissedKeys), [dismissedKeys]);

  const filterPlaces = useCallback(
    (list: LivePlace[]) =>
      list.filter(
        (p) =>
          hasUsablePlaceName(p.name) &&
          !dismissedSet.has(`place:${p.placeId}`)
      ),
    [dismissedSet]
  );

  const mapsFallbackCity =
    activeCenter?.label ||
    (live && live.ok ? live.locationLabel : null) ||
    profileLocation.label ||
    null;

  const onlineLinks = useMemo(
    () => buildOnlineStoreLinks(query.trim() || "household essentials"),
    [query]
  );

  const persistCenter = useCallback(
    async (center: SavedCenter) => {
      writeLocalSaved(center);
      if (!signedIn) return;
      try {
        await saveSearchLocation({
          label: center.label,
          latitude: center.latitude,
          longitude: center.longitude,
        });
      } catch {
        // Non-blocking — localStorage still holds the area.
      }
    },
    [signedIn]
  );

  const loadLive = useCallback(
    async (opts: {
      lat?: number;
      lng?: number;
      label?: string;
      source?: LocationSource;
      address?: string;
      q?: string;
      radius?: RadiusKm;
      refresh?: boolean;
    }) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (opts.lat != null && opts.lng != null) {
          params.set("lat", String(opts.lat));
          params.set("lng", String(opts.lng));
        }
        if (opts.label?.trim()) params.set("label", opts.label.trim());
        if (opts.address?.trim()) params.set("address", opts.address.trim());
        if (opts.source) params.set("source", opts.source);
        if (opts.q?.trim()) params.set("q", opts.q.trim());
        params.set("radiusKm", String(opts.radius ?? radiusKm));
        if (opts.refresh) params.set("refresh", "1");
        const res = await fetch(`/api/recommendations/live?${params}`, {
          cache: "no-store",
        });
        const data = (await res.json()) as LiveApiOk | LiveApiErr;
        setLive(data);
        if (data.ok) {
          const next: SavedCenter = {
            latitude: data.center.latitude,
            longitude: data.center.longitude,
            label:
              data.locationLabel ||
              opts.label ||
              `${data.center.latitude.toFixed(5)}, ${data.center.longitude.toFixed(5)}`,
          };
          setActiveCenter(next);
          setLocationSource(data.locationSource);
          if (data.locationLabel) setAreaText(data.locationLabel);
        }
      } catch (error) {
        setLive({
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : NEARBY_UNAVAILABLE,
          lastVerifiedAt: new Date().toISOString(),
          provider,
        });
      } finally {
        setLoading(false);
      }
    },
    [provider, radiusKm]
  );

  // Boot nearby search once: prefer saved coords, else Settings city text.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // Yield so boot setState is not synchronous inside the effect body.
      await Promise.resolve();
      if (cancelled) return;

      const profileSaved: SavedCenter | null =
        profileLocation.latitude != null && profileLocation.longitude != null
          ? {
              latitude: profileLocation.latitude,
              longitude: profileLocation.longitude,
              label: profileLocation.label ?? "Saved area",
            }
          : null;
      const savedPoint = profileSaved ?? readLocalSaved();

      if (savedPoint) {
        setActiveCenter(savedPoint);
        setAreaText(savedPoint.label);
        setLocationSource("saved");
        await loadLive({
          lat: savedPoint.latitude,
          lng: savedPoint.longitude,
          label: savedPoint.label,
          source: "saved",
          refresh: true,
        });
        return;
      }

      if (profileLocation.label) {
        setAreaText(profileLocation.label);
        await loadLive({
          address: profileLocation.label,
          source: "profile",
          refresh: true,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setArea = useCallback(async () => {
    const q = areaText.trim();
    if (!q) {
      setLocationError("Enter your area (for example Wapda Town, Gujranwala).");
      return;
    }
    setLocationBusy(true);
    setLocationError(null);
    try {
      const res = await fetch(
        `/api/recommendations/geocode?q=${encodeURIComponent(q)}`,
        { cache: "no-store" }
      );
      const data = (await res.json()) as
        | {
            ok: true;
            location: { latitude: number; longitude: number };
            formattedAddress: string;
          }
        | { ok: false; message: string };
      if (!data.ok) {
        setLocationError(data.message);
        return;
      }
      const next: SavedCenter = {
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        label: data.formattedAddress,
      };
      setActiveCenter(next);
      setAreaText(next.label);
      setLocationSource("saved");
      await persistCenter(next);
      await loadLive({
        lat: next.latitude,
        lng: next.longitude,
        label: next.label,
        source: "saved",
        refresh: true,
        q: query || undefined,
      });
    } catch (error) {
      setLocationError(
        error instanceof Error ? error.message : "Could not set that area."
      );
    } finally {
      setLocationBusy(false);
    }
  }, [areaText, loadLive, persistCenter, query]);

  const useDeviceLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Device location is not available in this browser.");
      return;
    }
    setLocationBusy(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void (async () => {
          const next: SavedCenter = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            label: "Device location",
          };
          const inPk = assertInPakistan(next);
          if (!inPk.ok) {
            setLocationError(inPk.message);
            setLocationBusy(false);
            return;
          }
          setActiveCenter(next);
          setAreaText(next.label);
          setLocationSource("device");
          await persistCenter(next);
          await loadLive({
            lat: next.latitude,
            lng: next.longitude,
            label: next.label,
            source: "device",
            refresh: true,
            q: query || undefined,
          });
          setLocationBusy(false);
        })();
      },
      () => {
        setLocationBusy(false);
        setLocationError(
          "Could not use device location. Keep your typed area, or try again."
        );
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 }
    );
  }, [loadLive, persistCenter, query]);

  const placeName =
    activeCenter?.label ||
    (live && live.ok ? live.locationLabel : null) ||
    areaText.trim() ||
    null;

  const searchContext = placeName
    ? `Searching within ${radiusKm} km of ${placeName}`
    : null;

  const nearbyList = useMemo(() => {
    if (!live || !live.ok) return [] as LivePlace[];
    return filterPlaces(live.sections.nearbyStores);
  }, [live, filterPlaces]);

  const filteredBillMatches = useMemo(
    () =>
      billMatches.map((m) => ({
        ...m,
        places: m.places.filter(
          (p) =>
            hasUsablePlaceName(p.name) &&
            !dismissedSet.has(`place:${p.placeId}`)
        ),
      })),
    [billMatches, dismissedSet]
  );

  const activeProviderLabel =
    live && "provider" in live && live.provider
      ? live.provider === "google"
        ? "Google Places"
        : "OpenStreetMap"
      : providerLabel;

  const retryNearby = () => {
    void loadLive({
      ...(activeCenter
        ? {
            lat: activeCenter.latitude,
            lng: activeCenter.longitude,
            label: activeCenter.label,
            source: locationSource ?? "saved",
          }
        : {
            address: areaText.trim() || profileLocation.label || undefined,
            source: "profile",
          }),
      refresh: true,
      q: query || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-accent/40 px-4 py-3 text-sm text-accent-foreground">
        <p className="font-medium">Live data · {activeProviderLabel}</p>
        <p className="mt-1">
          Nearby shops within a small radius of your area. Cards show name,
          type, and distance — open Maps to find the store.
        </p>
        {providerHint ? (
          <p className="mt-1 text-xs text-muted-foreground">{providerHint}</p>
        ) : null}
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="space-y-1">
          <Label htmlFor="your_area">Your area</Label>
          <Input
            id="your_area"
            value={areaText}
            onChange={(e) => setAreaText(e.target.value)}
            placeholder="Wapda Town, Gujranwala"
            disabled={locationBusy || loading}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={locationBusy || loading || !areaText.trim()}
            onClick={() => void setArea()}
          >
            {locationBusy ? "Setting…" : "Set area"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={locationBusy || loading}
            onClick={useDeviceLocation}
          >
            Use my device location
          </Button>
        </div>
        {locationError ? (
          <p className="text-sm text-destructive" role="alert">
            {locationError}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {searchContext ? (
            <p className="text-sm text-foreground">{searchContext}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Set your area to search nearby shops.
            </p>
          )}
          <div className="flex items-center gap-2">
            <Label htmlFor="radius_km" className="text-xs text-muted-foreground">
              Radius
            </Label>
            <select
              id="radius_km"
              value={radiusKm}
              disabled={loading || !activeCenter}
              onChange={(e) => {
                const next = normalizeRadiusKm(Number(e.target.value));
                setRadiusKm(next);
                if (!activeCenter) return;
                void loadLive({
                  lat: activeCenter.latitude,
                  lng: activeCenter.longitude,
                  label: activeCenter.label,
                  source: locationSource ?? "saved",
                  radius: next,
                  refresh: true,
                  q: query || undefined,
                });
              }}
              className="flex h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {RADIUS_KM_OPTIONS.map((km) => (
                <option key={km} value={km}>
                  {km} km
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[1fr_auto]">
        <div className="space-y-1">
          <Label htmlFor="live_search">Search near your area</Label>
          <Input
            id="live_search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pharmacy, supermarket, bakery…"
            disabled={loading}
          />
        </div>
        <div className="flex items-end gap-2">
          <Button
            type="button"
            disabled={loading || !query.trim() || !activeCenter}
            onClick={() => {
              setSection("nearby");
              void loadLive({
                ...(activeCenter
                  ? {
                      lat: activeCenter.latitude,
                      lng: activeCenter.longitude,
                      label: activeCenter.label,
                      source: locationSource ?? "saved",
                    }
                  : {}),
                q: query,
                refresh: true,
              });
            }}
          >
            {loading ? "Searching…" : "Search"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading || !activeCenter}
            onClick={retryNearby}
          >
            Retry
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <Button
            key={s.id}
            type="button"
            size="sm"
            variant={section === s.id ? "default" : "outline"}
            onClick={() => setSection(s.id)}
          >
            {s.label}
            {s.id === "saved" ? ` (${saved.length})` : ""}
            {s.id === "from-bills"
              ? ` (${filteredBillMatches.reduce((n, m) => n + m.places.length, 0)})`
              : ""}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground" role="status">
          Loading nearby shops…
        </p>
      ) : null}

      {live && !live.ok && section === "nearby" ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{live.message}</p>
          <div className="mt-4 flex justify-center">
            <Button type="button" size="sm" disabled={loading} onClick={retryNearby}>
              Retry
            </Button>
          </div>
        </div>
      ) : null}

      {section === "online" ? (
        <div className="space-y-3">
          <h2 className="font-heading text-xl">Online Stores</h2>
          <p className="text-sm text-muted-foreground">
            Search links only — no prices or delivery claims from HomeWise.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {onlineLinks.map((link) => (
              <li
                key={link.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <p className="font-medium text-foreground">{link.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{link.detail}</p>
                <Button
                  className="mt-3"
                  size="sm"
                  variant="outline"
                  nativeButton={false}
                  render={
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  Open
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {section === "from-bills" ? (
        <div className="space-y-4">
          <h2 className="font-heading text-xl">From your bills</h2>
          {filteredBillMatches.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              Scan a bill to see suggestions
            </p>
          ) : (
            filteredBillMatches.map((match) => (
              <div key={match.billItemId} className="space-y-2">
                <h3 className="font-medium text-foreground">
                  {match.billItemName}
                </h3>
                {match.error ? (
                  <p className="text-sm text-destructive">{match.error}</p>
                ) : null}
                {match.places.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No live places found for this item.
                  </p>
                ) : (
                  <ul className="grid gap-3 lg:grid-cols-2">
                    {match.places.map((place) => (
                      <PlaceCard
                        key={`${match.billItemId}-${place.placeId}`}
                        place={place}
                        signedIn={signedIn}
                        saved={savedSet.has(`place:${place.placeId}`)}
                        kind="bill_place_match"
                        billItemId={match.billItemId}
                        billItemName={match.billItemName}
                        fallbackCity={mapsFallbackCity}
                      />
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>
      ) : null}

      {section === "saved" ? (
        <div className="space-y-3">
          <h2 className="font-heading text-xl">Saved</h2>
          {removeState.error ? (
            <p className="text-sm text-destructive" role="alert">
              {removeState.error}
            </p>
          ) : null}
          {saved.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              Nothing saved yet.
            </p>
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {saved.map((row) => {
                const payload = row.payload as PlaceRecommendationPayload | null;
                const place =
                  payload &&
                  typeof payload === "object" &&
                  payload.place &&
                  (payload.place.source === "Google Places" ||
                    payload.place.source === "OpenStreetMap")
                    ? payload.place
                    : null;
                if (!place) {
                  return (
                    <li
                      key={row.id}
                      className="rounded-xl border border-border p-4 text-sm"
                    >
                      <p className="font-medium">{row.title}</p>
                      <form action={removeAction} className="mt-2">
                        <input type="hidden" name="id" value={row.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="ghost"
                          disabled={removePending}
                        >
                          Remove
                        </Button>
                      </form>
                    </li>
                  );
                }
                if (!hasUsablePlaceName(place.name)) return null;
                return (
                  <li key={row.id} className="space-y-2">
                    <PlaceCard
                      place={place}
                      signedIn={signedIn}
                      saved
                      fallbackCity={mapsFallbackCity}
                    />
                    <form action={removeAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <Button
                        type="submit"
                        size="sm"
                        variant="outline"
                        disabled={removePending}
                      >
                        Remove from saved
                      </Button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      {section === "nearby" && live?.ok ? (
        <div className="space-y-3">
          <h2 className="font-heading text-xl">Nearby Stores</h2>
          {live.cached ? (
            <p className="text-xs text-muted-foreground">Showing cached results.</p>
          ) : null}
          {nearbyList.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No nearby stores found within {radiusKm} km.
            </p>
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {nearbyList.map((place) => (
                <PlaceCard
                  key={place.placeId}
                  place={place}
                  signedIn={signedIn}
                  saved={savedSet.has(`place:${place.placeId}`)}
                  fallbackCity={mapsFallbackCity}
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
