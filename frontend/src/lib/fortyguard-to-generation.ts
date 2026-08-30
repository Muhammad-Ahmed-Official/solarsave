/*
  fortyguard-to-generation.ts

  Minimal helper: convert a single numeric GHI value (W/m²) from FortyGuard into
  annual irradiance (kWh/m²/year) and estimated annual system generation (kWh/year).

  Design decisions (explicit):
  - This module assumes FortyGuard returns a single numeric GHI value for the queried
    timestamp (no time-series support).
  - Do NOT multiply the GHI by 24 to obtain daily energy — GHI is a peak/instantaneous
    irradiance. Instead this helper uses a per-state "peak sun hours" daily-equivalent
    value and extrapolates the single GHI sample by:

      hours_per_year = peak_sun_hours_per_day * 365
      annual_irradiance_kWh_per_m2 = (GHI [W/m²]) * hours_per_year / 1000

    This approach approximates that the instantaneous GHI sample represents the
    representative peak irradiance and scales it by a state-level daily-equivalent
    peak-sun-hours value. It remains an approximation and is marked extrapolated.

  - Conversion to system generation uses the compact estimator:
      annual_generation_kWh = annual_irradiance_kWh_per_m2 * system_capacity_kW * performance_ratio
    This is a lightweight estimator for quick comparisons and diagnostics. It is NOT
    a replacement for a full PV production model which requires module tilt, azimuth,
    temperature losses, inverter curves, orientation, and a time-series irradiation input.

  Peak sun hours and defaults:
  - The module includes a PEAK_SUN_HOURS mapping (state name and 2-letter codes) for quick O(1)
    lookup. These values come from the project's supplied table and represent typical
    daily-equivalent peak sun hours by US state.
  - If no state or mapping entry is available, the helper falls back to a national
    average of 5.0 peak sun hours/day.
  - systemCapacityKw default = 5 kW: a convenience default (typical residential size);
    callers should supply the actual system size for accurate results.
  - performanceRatio default = 0.75: a conservative aggregate factor for system losses
    (typical industry ranges ~0.70–0.85). Use a measured or agreed PR for production-grade
    estimates.

  Transparency and warnings:
  - All outputs include the values used (system size, PR, peak sun hours) and an
    `extrapolated` flag plus a `warning` string when the estimate is derived from a
    single instantaneous GHI sample.
  - For production-grade forecasts, supply either a validated annualGenerationKwh
    from a frontend model (preferred) or provide a full hourly/daily irradiance
    time-series and use a PV performance model (e.g., NREL PVWatts or equivalent).
*/

export type FortyGuardResult = any;

export type EstimateOptions = {
  systemCapacityKw?: number; // kW
  performanceRatio?: number; // unitless (0-1)
  state?: string; // US state name or 2-letter code to look up peak sun hours
  peakSunHoursPerDay?: number; // override per-day peak sun hours
};

// Peak sun hours per day by US state (source: user-provided table). Values are in hours/day.
// Lookups should be O(1) by normalized state name or 2-letter code.
export const PEAK_SUN_HOURS: Record<string, number> = {
  "arizona": 6.5,
  "new mexico": 6.5,
  "nevada": 6.4,
  "hawaii": 5.8,
  "california": 5.6,
  "colorado": 5.5,
  "utah": 5.5,
  "florida": 5.3,
  "texas": 5.3,
  "wyoming": 5.2,
  "oklahoma": 5.1,
  "kansas": 5.0,
  "idaho": 4.9,
  "georgia": 4.8,
  "nebraska": 4.8,
  "south carolina": 4.8,
  "louisiana": 4.7,
  "montana": 4.7,
  "north carolina": 4.7,
  "south dakota": 4.7,
  "alabama": 4.6,
  "mississippi": 4.6,
  "missouri": 4.6,
  "arkansas": 4.5,
  "north dakota": 4.5,
  "virginia": 4.5,
  "delaware": 4.4,
  "district of columbia": 4.4,
  "iowa": 4.4,
  "maryland": 4.4,
  "tennessee": 4.4,
  "illinois": 4.3,
  "kentucky": 4.3,
  "minnesota": 4.3,
  "new jersey": 4.3,
  "connecticut": 4.2,
  "indiana": 4.2,
  "maine": 4.2,
  "massachusetts": 4.2,
  "new hampshire": 4.2,
  "oregon": 4.2,
  "rhode island": 4.2,
  "wisconsin": 4.2,
  "ohio": 4.1,
  "pennsylvania": 4.1,
  "west virginia": 4.1,
  "michigan": 4.0,
  "new york": 4.0,
  "vermont": 4.0,
  "washington": 3.8,
  "alaska": 3.0,
  // common 2-letter codes map to same values for quick lookup
  "az": 6.5,
  "nm": 6.5,
  "nv": 6.4,
  "hi": 5.8,
  "ca": 5.6,
  "co": 5.5,
  "ut": 5.5,
  "fl": 5.3,
  "tx": 5.3,
  "wy": 5.2,
  "ok": 5.1,
  "ks": 5.0,
  "id": 4.9,
  "ga": 4.8,
  "ne": 4.8,
  "sc": 4.8,
  "la": 4.7,
  "mt": 4.7,
  "nc": 4.7,
  "sd": 4.7,
  "al": 4.6,
  "ms": 4.6,
  "mo": 4.6,
  "ar": 4.5,
  "nd": 4.5,
  "va": 4.5,
  "de": 4.4,
  "dc": 4.4,
  "ia": 4.4,
  "md": 4.4,
  "tn": 4.4,
  "il": 4.3,
  "ky": 4.3,
  "mn": 4.3,
  "nj": 4.3,
  "ct": 4.2,
  "in": 4.2,
  "me": 4.2,
  "ma": 4.2,
  "nh": 4.2,
  "or": 4.2,
  "ri": 4.2,
  "wi": 4.2,
  "oh": 4.1,
  "pa": 4.1,
  "wv": 4.1,
  "mi": 4.0,
  "ny": 4.0,
  "vt": 4.0,
  "wa": 3.8,
  "ak": 3.0,
};

export function getPeakSunHoursForState(stateValue?: string): number {
  if (!stateValue) return 5.0; // national average fallback
  const cleaned = String(stateValue).trim().toLowerCase();
  if (PEAK_SUN_HOURS.hasOwnProperty(cleaned)) return PEAK_SUN_HOURS[cleaned];
  // try converting 2-letter code upper to lower
  const maybe = cleaned.slice(0, 2);
  if (PEAK_SUN_HOURS.hasOwnProperty(maybe)) return PEAK_SUN_HOURS[maybe];
  return 5.0; // fallback national average
}

export type EstimateResult = {
  annualIrradianceKwhPerM2: number | null;
  annualGenerationKwh: number | null;
  systemCapacityKwUsed?: number;
  performanceRatioUsed?: number;
  extrapolated: boolean;
  warning?: string;
};

function safeNumber(v: unknown): number | null {
  const n = Number(v as any);
  return Number.isFinite(n) ? n : null;
}

export function estimateAnnualIrradianceKwhPerM2(fg: FortyGuardResult, peakSunHoursPerDay?: number): { value: number | null; extrapolated: boolean; warning?: string } {
  // Expect a single numeric GHI value in the FortyGuard result and extrapolate to a year.
  // Use peakSunHoursPerDay (hours/day) as the daily-equivalent hours instead of 24.
  try {
    const data = fg?.data ?? fg?.result ?? fg;
    const locations = data?.locations ?? (data?.result && data.result.locations) ?? null;
    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return { value: null, extrapolated: false, warning: 'No locations found in FortyGuard result' };
    }

    const loc = locations[0];

    const tryNumber = (v: unknown) => {
      const n = safeNumber(v);
      return n !== null ? n : null;
    };

    // Look for a single numeric GHI in the response (no arrays)
    let ghi: number | null = null;
    if (loc.solar_irradiance && typeof loc.solar_irradiance === 'object') {
      ghi = tryNumber(loc.solar_irradiance.ghi) ?? tryNumber(loc.solar_irradiance.dni) ?? tryNumber(loc.solar_irradiance.dhi) ?? null;
      if (ghi === null && loc.solar_irradiance.clear_sky) {
        ghi = tryNumber(loc.solar_irradiance.clear_sky.ghi) ?? tryNumber(loc.solar_irradiance.clear_sky.dni) ?? tryNumber(loc.solar_irradiance.clear_sky.dhi) ?? null;
      }
    }

    if (ghi === null && loc.parameters && typeof loc.parameters === 'object') {
      for (const key of Object.keys(loc.parameters)) {
        if (key.toLowerCase().includes('ghi') || key.toLowerCase().includes('global')) {
          ghi = tryNumber(loc.parameters[key]);
          if (ghi !== null) break;
        }
      }
    }

    if (ghi === null) {
      return { value: null, extrapolated: false, warning: 'No numeric GHI value found in FortyGuard result' };
    }

    const hoursPerDay = Number.isFinite(Number(peakSunHoursPerDay)) ? Number(peakSunHoursPerDay) : 5.0; // default national average
    const hoursPerYear = hoursPerDay * 365;
    const annualKwhPerM2 = (ghi * hoursPerYear) / 1000; // W/m2 * h -> Wh/m2 -> kWh/m2

    return { value: Number.isFinite(annualKwhPerM2) ? annualKwhPerM2 : null, extrapolated: true, warning: 'Single GHI value extrapolated to annual estimate using peak sun hours' };
  } catch (e) {
    return { value: null, extrapolated: false, warning: String(e) };
  }
}

export function estimateAnnualGenerationKwh(fg: FortyGuardResult, options?: EstimateOptions): EstimateResult {
  const defaultSystemKw = 5;
  const defaultPR = 0.75;

  const systemCapacityKw = options?.systemCapacityKw ?? defaultSystemKw;
  const performanceRatio = options?.performanceRatio ?? defaultPR;

  const peak = options?.peakSunHoursPerDay ?? getPeakSunHoursForState(options?.state);
  const irr = estimateAnnualIrradianceKwhPerM2(fg, peak);

  if (irr.value === null) {
    return {
      annualIrradianceKwhPerM2: null,
      annualGenerationKwh: null,
      extrapolated: irr.extrapolated,
      warning: irr.warning ?? 'No irradiance available to estimate generation',
    };
  }

  const annualGeneration = irr.value * systemCapacityKw * performanceRatio;

  return {
    annualIrradianceKwhPerM2: irr.value,
    annualGenerationKwh: Number.isFinite(annualGeneration) ? annualGeneration : null,
    systemCapacityKwUsed: systemCapacityKw,
    performanceRatioUsed: performanceRatio,
    extrapolated: irr.extrapolated,
    warning: irr.warning,
  };
}
