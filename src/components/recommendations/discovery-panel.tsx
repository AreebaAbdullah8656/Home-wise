"use client";

import { useCallback, useEffect, useMemo, useState, useActionState } from "react";
import {
  clearSearchLocation,
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
  normalizeRadiusKm,
  RADIUS_KM_OPTIONS,
  type RadiusKm,
} from "@/lib/places/distance";
import { assertInPakistan } from "@/lib/places/pakistan";

const initial: ActionState = {};
const STORAGE_KEY = "homewise:search-location-v1";
const ACCURACY_WARN_M = 2000;

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

function writeLocalSaved(center: SavedCenter | null) {
  if (typeof window === "undefined") return;
  if (!center) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(center));
}

function coordsLabel(lat: number, lng: number) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
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
  const [radiusKm, setRadiusKm] = useState<RadiusKm>(3);
  const [areaQuery, setAreaQuery] = useState(profileLocation.label ?? "");
  const [resolvedArea, setResolvedArea] = useState<SavedCenter | null>(() => {
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
  const [activeCenter, setActiveCenter] = useState<SavedCenter | null>(
    resolvedArea
  );
  const [locationSource, setLocationSource] = useState<LocationSource | null>(
    resolvedArea ? "saved" : null
  );
  const [deviceAccuracyM, setDeviceAccuracyM] = useState<number | null>(null);
  const [geoNote, setGeoNote] = useState<string | null>(null);
  const [areaBusy, setAreaBusy] = useState(false);
  const [areaError, setAreaError] = useState<string | null>(null);
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
  const [saveLocState, saveLocAction, saveLocPending] = useActionState(
    saveSearchLocation,
    initial
  );
  const [clearLocState, clearLocAction, clearLocPending] = useActionState(
    clearSearchLocation,
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
          setActiveCenter({
            latitude: data.center.latitude,
            longitude: data.center.longitude,
            label:
              data.locationLabel ||
              opts.label ||
              coordsLabel(data.center.latitude, data.center.longitude),
          });
          setLocationSource(data.locationSource);
        }
      } catch (error) {
        setLive({
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to refresh live recommendations.",
          lastVerifiedAt: new Date().toISOString(),
          provider,
        });
      } finally {
        setLoading(false);
      }
    },
    [provider, radiusKm]
  );

  // Boot: (a) saved point → (b) browser geolocation → (c) Settings city
  useEffect(() => {
    let cancelled = false;

    const profileSaved: SavedCenter | null =
      profileLocation.latitude != null && profileLocation.longitude != null
        ? {
            latitude: profileLocation.latitude,
            longitude: profileLocation.longitude,
            label: profileLocation.label ?? "Saved area",
          }
        : null;
    const localSaved = readLocalSaved();
    const savedPoint = profileSaved ?? localSaved;

    if (savedPoint) {
      setResolvedArea(savedPoint);
      setActiveCenter(savedPoint);
      setLocationSource("saved");
      setAreaQuery(savedPoint.label);
      setGeoNote("Using your saved area.");
      void loadLive({
        lat: savedPoint.latitude,
        lng: savedPoint.longitude,
        label: savedPoint.label,
        source: "saved",
        refresh: true,
      });
      return;
    }

    if (!navigator.geolocation) {
      setGeoNote(
        profileLocation.label
          ? "Device geolocation unavailable — using Settings location."
          : "Device geolocation unavailable and no Settings location set."
      );
      void loadLive({
        address: profileLocation.label ?? undefined,
        source: "profile",
        refresh: true,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        const next = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          label: "Device location",
        };
        const inPk = assertInPakistan(next);
        const accuracy =
          typeof pos.coords.accuracy === "number" ? pos.coords.accuracy : null;
        setDeviceAccuracyM(accuracy);
        if (!inPk.ok) {
          setGeoNote(inPk.message);
          void loadLive({
            address: profileLocation.label ?? undefined,
            source: "profile",
            refresh: true,
          });
          return;
        }
        setActiveCenter(next);
        setLocationSource("device");
        const accuracyNote =
          accuracy != null
            ? ` Device accuracy ±${Math.round(accuracy)} m.`
            : "";
        if (accuracy != null && accuracy > ACCURACY_WARN_M) {
          setGeoNote(
            `Your device location is approximate. Pick your area on the map or enter your area name.${accuracyNote}`
          );
        } else {
          setGeoNote(`Using live device location.${accuracyNote}`);
        }
        void loadLive({
          lat: next.latitude,
          lng: next.longitude,
          label: next.label,
          source: "device",
          refresh: true,
        });
      },
      () => {
        if (cancelled) return;
        setGeoNote(
          profileLocation.label
            ? "Location permission declined — using Settings location."
            : "Location permission declined and no Settings location set."
        );
        void loadLive({
          address: profileLocation.label ?? undefined,
          source: "profile",
          refresh: true,
        });
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 }
    );

    return () => {
      cancelled = true;
    };
    // Intentionally once on mount for location bootstrap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolveArea = useCallback(async () => {
    const q = areaQuery.trim();
    if (!q) {
      setAreaError("Enter an area or town name in Pakistan.");
      return;
    }
    setAreaBusy(true);
    setAreaError(null);
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
        | { ok: false; message: string; httpStatus?: number };
      if (!data.ok) {
        setAreaError(data.message);
        return;
      }
      const next: SavedCenter = {
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        label: data.formattedAddress,
      };
      setResolvedArea(next);
      setActiveCenter(next);
      setLocationSource("query");
      setGeoNote("Resolved area ready — save it to reuse next time.");
      void loadLive({
        lat: next.latitude,
        lng: next.longitude,
        label: next.label,
        source: "query",
        refresh: true,
        q: query || undefined,
      });
    } catch (error) {
      setAreaError(
        error instanceof Error ? error.message : "Area lookup failed."
      );
    } finally {
      setAreaBusy(false);
    }
  }, [areaQuery, loadLive, query]);

  const useDeviceLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setAreaError("Device geolocation is unavailable in this browser.");
      return;
    }
    setAreaBusy(true);
    setAreaError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          label: "Device location",
        };
        const inPk = assertInPakistan(next);
        const accuracy =
          typeof pos.coords.accuracy === "number" ? pos.coords.accuracy : null;
        setDeviceAccuracyM(accuracy);
        setAreaBusy(false);
        if (!inPk.ok) {
          setAreaError(inPk.message);
          return;
        }
        setResolvedArea(next);
        setActiveCenter(next);
        setLocationSource("device");
        setAreaQuery(next.label);
        if (accuracy != null && accuracy > ACCURACY_WARN_M) {
          setGeoNote(
            `Your device location is approximate. Pick your area on the map or enter your area name. (±${Math.round(accuracy)} m)`
          );
        } else {
          setGeoNote(
            accuracy != null
              ? `Using live device location (±${Math.round(accuracy)} m).`
              : "Using live device location."
          );
        }
        void loadLive({
          lat: next.latitude,
          lng: next.longitude,
          label: next.label,
          source: "device",
          refresh: true,
          q: query || undefined,
        });
      },
      (err) => {
        setAreaBusy(false);
        setAreaError(err.message || "Could not read device location.");
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 }
    );
  }, [loadLive, query]);

  const confirmSaveArea = useCallback(() => {
    if (!resolvedArea) return;
    writeLocalSaved(resolvedArea);
    setActiveCenter(resolvedArea);
    setLocationSource("saved");
    setGeoNote("Saved area for this browser.");
  }, [resolvedArea]);

  const resetLocation = useCallback(() => {
    writeLocalSaved(null);
    setResolvedArea(null);
    setActiveCenter(null);
    setLocationSource(null);
    setDeviceAccuracyM(null);
    setGeoNote("Location reset. Pick an area or use device location.");
  }, []);

  const activeProviderLabel =
    live && "provider" in live && live.provider
      ? live.provider === "google"
        ? "Google Places"
        : "OpenStreetMap"
      : providerLabel;

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

  const searchContext =
    activeCenter != null
      ? `Searching within ${radiusKm} km of ${activeCenter.label || "selected point"} (${coordsLabel(activeCenter.latitude, activeCenter.longitude)})`
      : live && live.ok
        ? `Searching within ${normalizeRadiusKm((live.radiusKm ?? live.radiusMeters / 1000) as number)} km of ${live.locationLabel || "resolved point"} (${coordsLabel(live.center.latitude, live.center.longitude)})`
        : null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-accent/40 px-4 py-3 text-sm text-accent-foreground">
        <p className="font-medium">Live data · {activeProviderLabel}</p>
        <p className="mt-1">
          Pakistan radius search — shop cards show name, type, and distance.
          Open Google Maps to find the store. Prices and delivery claims are
          never invented.
        </p>
        {providerHint ? (
          <p className="mt-1 text-xs text-muted-foreground">{providerHint}</p>
        ) : null}
        <p className="mt-2 text-xs">
          {geoNote || "Resolving location…"}
          {profileLocation.label
            ? ` · Settings location: ${profileLocation.label}`
            : ""}
          {deviceAccuracyM != null
            ? ` · Accuracy ±${Math.round(deviceAccuracyM)} m`
            : ""}
          {live && live.ok
            ? ` · Last verified ${new Date(live.lastVerifiedAt).toLocaleString()}${
                live.cached ? " (short cache)" : ""
              }`
            : ""}
        </p>
        {searchContext ? (
          <p className="mt-2 text-xs font-medium text-foreground">
            {searchContext}
          </p>
        ) : null}
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="space-y-1">
          <Label htmlFor="area_search">Exact area (Pakistan)</Label>
          <Input
            id="area_search"
            value={areaQuery}
            onChange={(e) => setAreaQuery(e.target.value)}
            placeholder='e.g. "Wapda Town, Gujranwala"'
            disabled={areaBusy || loading}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={areaBusy || loading || !areaQuery.trim()}
            onClick={() => void resolveArea()}
          >
            {areaBusy ? "Looking up…" : "Find area"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={areaBusy || loading}
            onClick={useDeviceLocation}
          >
            Use my device location
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!resolvedArea || areaBusy}
            onClick={confirmSaveArea}
          >
            Confirm for this browser
          </Button>
          {signedIn && resolvedArea ? (
            <form action={saveLocAction}>
              <input
                type="hidden"
                name="location_label"
                value={resolvedArea.label}
              />
              <input
                type="hidden"
                name="location_lat"
                value={String(resolvedArea.latitude)}
              />
              <input
                type="hidden"
                name="location_lng"
                value={String(resolvedArea.longitude)}
              />
              <Button type="submit" size="sm" disabled={saveLocPending}>
                {saveLocPending ? "Saving…" : "Save to Settings"}
              </Button>
            </form>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={areaBusy}
            onClick={resetLocation}
          >
            Reset location
          </Button>
          {signedIn ? (
            <form action={clearLocAction}>
              <Button
                type="submit"
                size="sm"
                variant="ghost"
                disabled={clearLocPending}
              >
                Clear saved coords
              </Button>
            </form>
          ) : null}
        </div>
        {resolvedArea ? (
          <p className="text-xs text-muted-foreground">
            Resolved: <span className="text-foreground">{resolvedArea.label}</span>{" "}
            ({coordsLabel(resolvedArea.latitude, resolvedArea.longitude)})
            {locationSource ? ` · source: ${locationSource}` : ""}
          </p>
        ) : null}
        {areaError ? (
          <p className="text-sm text-destructive" role="alert">
            {areaError}
          </p>
        ) : null}
        {saveLocState.success || clearLocState.success ? (
          <p className="text-sm" role="status">
            {saveLocState.success || clearLocState.success}
          </p>
        ) : null}
        {saveLocState.error || clearLocState.error ? (
          <p className="text-sm text-destructive" role="alert">
            {saveLocState.error || clearLocState.error}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="radius_km">Radius</Label>
          <select
            id="radius_km"
            value={radiusKm}
            disabled={loading}
            onChange={(e) => {
              const next = normalizeRadiusKm(Number(e.target.value));
              setRadiusKm(next);
              void loadLive({
                ...(activeCenter
                  ? {
                      lat: activeCenter.latitude,
                      lng: activeCenter.longitude,
                      label: activeCenter.label,
                      source: locationSource ?? "saved",
                    }
                  : {
                      address: profileLocation.label ?? undefined,
                      source: "profile",
                    }),
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
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={loading}
          onClick={() =>
            void loadLive({
              ...(activeCenter
                ? {
                    lat: activeCenter.latitude,
                    lng: activeCenter.longitude,
                    label: activeCenter.label,
                    source: locationSource ?? "saved",
                  }
                : {
                    address: profileLocation.label ?? undefined,
                    source: "profile",
                  }),
              refresh: true,
              q: query || undefined,
            })
          }
        >
          {loading ? "Refreshing…" : "Refresh now"}
        </Button>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[1fr_auto]">
        <div className="space-y-1">
          <Label htmlFor="live_search">Search near your area</Label>
          <Input
            id="live_search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pharmacy, supermarket, detergent store…"
            disabled={loading}
          />
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            disabled={loading || !query.trim()}
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
                  : {
                      address: profileLocation.label ?? undefined,
                      source: "profile",
                    }),
                q: query,
                refresh: true,
              });
            }}
          >
            {loading ? "Searching…" : "Search"}
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
          Loading live results…
        </p>
      ) : null}

      {live && !live.ok ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground">No live results</p>
          {live.httpStatus != null ? (
            <p className="mt-2 font-mono text-xs text-foreground">
              HTTP {live.httpStatus}
              {live.code ? ` · ${live.code}` : ""}
            </p>
          ) : live.code ? (
            <p className="mt-2 font-mono text-xs text-foreground">{live.code}</p>
          ) : null}
          <p className="mt-2">{live.message}</p>
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
                if (!hasUsablePlaceName(place.name)) {
                  return null;
                }
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
          {query.trim() ? (
            <p className="text-sm text-muted-foreground">
              Also see Online Stores for “{query.trim()}”.
            </p>
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
