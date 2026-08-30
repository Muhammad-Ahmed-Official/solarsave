"use server";

import { findIrradiance, flattenReadings, type IrradianceReading, type ReadingRow } from "./ghi";

/**
 * Server Function that fetches solar irradiance for a coordinate from
 * FortyGuard.
 *
 * It runs on the server so FORTYGUARD_API_KEY never reaches the browser, and
 * it returns a plain, already-shaped object. Server Function return values are
 * serialised across the RSC boundary, so an `Error` instance can never be
 * returned here — it would be dropped or blow up the boundary.
 */

export interface GhiSuccess {
  ok: true;
  /** Null when the service answered but reported no irradiance figure. */
  irradiance: IrradianceReading | null;
  /** Everything else the service returned, for the raw-readings disclosure. */
  readings: ReadingRow[];
}

export interface GhiFailure {
  ok: false;
  /** Safe to render directly to a user. */
  message: string;
  code: "unconfigured" | "invalid-input" | "upstream" | "timeout" | "network";
}

export type GhiResult = GhiSuccess | GhiFailure;

export interface GhiQuery {
  latitude: number;
  longitude: number;
}

const REQUEST_TIMEOUT_MS = 15_000;
const FORTYGUARD_URL = "https://api.fortyguard.com/v1/env_params";

function isValidCoordinate(query: GhiQuery) {
  return (
    Number.isFinite(query.latitude) &&
    Number.isFinite(query.longitude) &&
    Math.abs(query.latitude) <= 90 &&
    Math.abs(query.longitude) <= 180
  );
}

export async function getGHI(query: GhiQuery): Promise<GhiResult> {
  // A Server Function is reachable by direct POST, not just through the UI,
  // so the input is validated here rather than trusted from the caller.
  if (!query || !isValidCoordinate(query)) {
    return {
      ok: false,
      code: "invalid-input",
      message: "That location does not look like a valid coordinate.",
    };
  }

  const apiKey = process.env.FORTYGUARD_API_KEY;
  if (!apiKey) {
    console.error("[getGHI] FORTYGUARD_API_KEY is not set — see .env.example");
    return {
      ok: false,
      code: "unconfigured",
      message:
        "Solar data is not configured on this server. Add FORTYGUARD_API_KEY to .env.local and restart.",
    };
  }

  try {
    // Use yesterday as the single-day start_date for filter_type 3 (no end_date)
    const pad = (n: number) => String(n).padStart(2, "0");
    const formatYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const response = await fetch(FORTYGUARD_URL, {
      method: "POST",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        latitude: query.latitude,
        longitude: query.longitude,
        temperature: 10,
        date_time: {
          start_date: formatYmd(yesterday),
          filter_type: 3,
        },
      }),
    });

    if (!response.ok) {
      // Upstream detail is logged server-side; the user gets a plain sentence.
      console.error("[getGHI] upstream %s: %s", response.status, await response.text());
      return {
        ok: false,
        code: "upstream",
        message:
          response.status === 401 || response.status === 403
            ? "The solar data service rejected our credentials."
            : "The solar data service could not answer for this location right now.",
      };
    }

    const data: unknown = await response.json();

    return {
      ok: true,
      irradiance: findIrradiance(data),
      readings: flattenReadings(data),
    };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    console.error("[getGHI]", error);
    return {
      ok: false,
      code: timedOut ? "timeout" : "network",
      message: timedOut
        ? "The solar data service took too long to respond. Please try again."
        : "We could not reach the solar data service. Check your connection and try again.",
    };
  }
}
