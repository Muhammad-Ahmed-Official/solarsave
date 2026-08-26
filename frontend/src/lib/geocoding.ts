/**
 * Address lookup via OpenStreetMap Nominatim.
 *
 * Runs in the browser: there is no key to protect, and keeping it client-side
 * means suggestions are not gated behind a server round-trip.
 */

export interface GeocodedPlace {
  id: string;
  title: string;
  subtitle: string;
  displayName: string;
  country?: string;
  state?: string;
  county?: string;
  longitude: number;
  latitude: number;
}

interface NominatimAddress {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  country?: string;
}

interface NominatimSearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: NominatimAddress;
}

const NOMINATIM = "https://nominatim.openstreetmap.org";

/** Nominatim's usage policy asks for a contact address on every request. */
const CONTACT = process.env.NEXT_PUBLIC_GEOCODER_CONTACT;

function buildSubtitle(address: NominatimAddress | undefined, displayName: string) {
  if (!address) {
    return displayName;
  }

  const locality = address.city || address.town || address.village || address.county;
  const street = [address.house_number, address.road].filter(Boolean).join(" ");
  const parts = [street || address.neighbourhood || locality, locality, address.state]
    .filter(Boolean)
    .map((part) => String(part).trim());

  const unique = parts.filter((part, index) => parts.indexOf(part) === index);
  return unique.length > 0 ? unique.join(" • ") : displayName;
}

function toPlace(result: NominatimSearchResult): GeocodedPlace {
  const title =
    result.name?.trim() || result.display_name.split(",")[0]?.trim() || result.display_name;

  return {
    id: String(result.place_id),
    title,
    subtitle: buildSubtitle(result.address, result.display_name),
    displayName: result.display_name,
    country: result.address?.country,
    state: result.address?.state,
    county: result.address?.county,
    longitude: Number(result.lon),
    latitude: Number(result.lat),
  };
}

function hasCoordinates(place: GeocodedPlace) {
  return Number.isFinite(place.longitude) && Number.isFinite(place.latitude);
}

async function requestJson<T>(url: URL, signal?: AbortSignal): Promise<T> {
  if (CONTACT) {
    url.searchParams.set("email", CONTACT);
  }

  const response = await fetch(url.toString(), {
    signal,
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Address lookup failed (${response.status}).`);
  }

  return (await response.json()) as T;
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<GeocodedPlace[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const url = new URL(`${NOMINATIM}/search`);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "6");

  const results = await requestJson<NominatimSearchResult[]>(url, signal);
  const places = results.map(toPlace).filter(hasCoordinates);

  // Nominatim occasionally repeats a place_id across result variants; duplicate
  // React keys would silently drop rows from the list.
  const seen = new Set<string>();
  return places.filter((place) => {
    if (seen.has(place.id)) {
      return false;
    }
    seen.add(place.id);
    return true;
  });
}

/** Resolves a raw coordinate — e.g. from the browser's geolocation — to a place. */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<GeocodedPlace | null> {
  const url = new URL(`${NOMINATIM}/reverse`);
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");

  const result = await requestJson<NominatimSearchResult>(url, signal);
  if (!result?.place_id) {
    return null;
  }

  const place = toPlace(result);
  return hasCoordinates(place) ? place : null;
}
