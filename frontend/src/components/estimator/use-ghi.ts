"use client";

import { useCallback, useRef, useState } from "react";
import { getGHI } from "@/lib/get-ghi";
import type { IrradianceReading, ReadingRow } from "@/lib/ghi";
import type { GeocodedPlace } from "@/lib/geocoding";

export type GhiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  /** `irradiance` is null when the service answered but reported no figure. */
  | { status: "ready"; irradiance: IrradianceReading | null; readings: ReadingRow[] };

/** State plus the address it belongs to, so a result can never outlive it. */
type Tagged = GhiState & { placeId: string | null };

const IDLE: Tagged = { status: "idle", placeId: null };

/**
 * Owns the FortyGuard lookup for the selected address.
 *
 * Results are tagged with the place they were fetched for and compared during
 * render, so switching address can never leave stale numbers on screen — and
 * no effect is needed to clear them.
 */
export function useGhi(place: GeocodedPlace | null) {
  const [tagged, setTagged] = useState<Tagged>(IDLE);

  // Identifies the newest request so a slow earlier response cannot land last.
  const requestId = useRef(0);
  const placeId = place?.id ?? null;

  const state: GhiState = tagged.placeId === placeId ? tagged : IDLE;

  const fetchFor = useCallback(async (target: GeocodedPlace) => {
    const id = (requestId.current += 1);
    setTagged({ status: "loading", placeId: target.id });

    const result = await getGHI({
      latitude: target.latitude,
      longitude: target.longitude,
    });

    if (requestId.current !== id) {
      return;
    }

    setTagged(
      result.ok
        ? {
            status: "ready",
            irradiance: result.irradiance,
            readings: result.readings,
            placeId: target.id,
          }
        : { status: "error", message: result.message, placeId: target.id }
    );
  }, []);

  const refresh = useCallback(() => {
    if (place) {
      fetchFor(place);
    }
  }, [fetchFor, place]);

  return { state, fetchFor, refresh };
}
