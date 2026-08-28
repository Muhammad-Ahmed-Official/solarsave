import type { GeocodedPlace } from "@/lib/geocoding";

type QueryValue = string | string[] | undefined;

export interface EstimateSearchParamsInput {
  placeId?: QueryValue;
  title?: QueryValue;
  subtitle?: QueryValue;
  details?: QueryValue;
  lat?: QueryValue;
  lng?: QueryValue;
  long?: QueryValue;
  longitude?: QueryValue;
}

export interface EstimateLocation {
  placeId: string;
  title: string;
  subtitle: string;
  details: string;
  latitude: number | null;
  longitude: number | null;
}

function firstText(value: QueryValue) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function readText(value: QueryValue, fallback = "") {
  const text = firstText(value).trim();
  return text || fallback;
}

function readNumber(value: QueryValue) {
  const text = firstText(value).trim();
  if (!text) {
    return null;
  }

  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

export function parseEstimateLocation(
  searchParams?: EstimateSearchParamsInput
): EstimateLocation {
  const title = readText(searchParams?.title, "Selected location");
  const subtitle = readText(searchParams?.subtitle, readText(searchParams?.details, title));
  const details = readText(searchParams?.details, subtitle || title);

  return {
    placeId: readText(searchParams?.placeId, ""),
    title,
    subtitle,
    details,
    latitude: readNumber(searchParams?.lat),
    longitude:
      readNumber(searchParams?.lng) ??
      readNumber(searchParams?.long) ??
      readNumber(searchParams?.longitude),
  };
}

export function estimateLocationToPlace(location: EstimateLocation): GeocodedPlace | null {
  if (location.latitude === null || location.longitude === null) {
    return null;
  }

  return {
    id: location.placeId || `${location.latitude},${location.longitude}`,
    title: location.title,
    subtitle: location.subtitle,
    displayName: location.details || location.subtitle || location.title,
    country: undefined,
    state: undefined,
    county: undefined,
    latitude: location.latitude,
    longitude: location.longitude,
  };
}

export function buildEstimateSearchParams(place: GeocodedPlace) {
  const params = new URLSearchParams();
  params.set("placeId", place.id);
  params.set("title", place.title);
  params.set("subtitle", place.subtitle);
  params.set("details", place.displayName);
  params.set("lat", String(place.latitude));
  params.set("lng", String(place.longitude));
  return params;
}

export function buildEstimateHref(activityId: string, place: GeocodedPlace) {
  return `/estimate/${encodeURIComponent(activityId)}?${buildEstimateSearchParams(place).toString()}`;
}
