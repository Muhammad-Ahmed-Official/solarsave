/**
 * Normalises whatever the environmental-data provider returns into the one
 * number the savings model needs: annual global horizontal irradiance in
 * kWh/m² per year.
 *
 * The provider's response schema is not contractually stable, so nothing here
 * assumes a fixed shape — it walks the payload and reasons about the value it
 * finds, recording how it interpreted it so the UI can say so out loud.
 */

export type IrradianceBasis =
  /** Provider gave an annual total; used as-is. */
  | "annual"
  /** Provider gave a daily total; multiplied by 365. */
  | "daily"
  /** Provider gave a single-moment reading in W/m²; extrapolated. */
  | "instantaneous";

export interface IrradianceReading {
  /** kWh/m² per year — the unit computeSolar expects. */
  annualKwhPerM2: number;
  /** The number exactly as the provider reported it. */
  reportedValue: number;
  reportedUnit: string;
  basis: IrradianceBasis;
  /** True when annualKwhPerM2 was inferred rather than reported directly. */
  derived: boolean;
  /** Where in the payload it was found, e.g. "data.ghi". */
  sourceKey: string;
}

export interface ReadingRow {
  key: string;
  label: string;
  value: string;
}

/**
 * Peak sun hours assumed when converting a single-moment W/m² reading into an
 * annual total. Mid-range for inhabited latitudes.
 */
export const ASSUMED_PEAK_SUN_HOURS = 5;

const GHI_KEY =
  /(^|[._-])(ghi|dni|dhi)([._-]|$)|global[_ -]?horizontal|irradian|insolation|solar[_ -]?radiation/i;

function humanizeKey(key: string) {
  const last = key.split(".").pop() ?? key;
  const spaced = last.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
  if (/^(ghi|dni|dhi|uv|co2)$/i.test(spaced)) {
    return spaced.toUpperCase();
  }
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatScalar(value: unknown) {
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return String(value);
}

/** Flattens every scalar leaf of an arbitrarily shaped JSON payload. */
export function flattenReadings(payload: unknown, maxRows = 24): ReadingRow[] {
  const rows: ReadingRow[] = [];
  const seen = new Set<unknown>();

  function walk(node: unknown, path: string, depth: number) {
    if (rows.length >= maxRows || depth > 6 || node === null || node === undefined) {
      return;
    }

    if (typeof node === "object") {
      if (seen.has(node)) {
        return;
      }
      seen.add(node);

      const entries = Array.isArray(node)
        ? node.map((item, index) => [String(index), item] as const)
        : Object.entries(node as Record<string, unknown>);

      for (const [key, child] of entries) {
        walk(child, path ? `${path}.${key}` : key, depth + 1);
      }
      return;
    }

    if (typeof node === "string" && node.length > 80) {
      return;
    }

    rows.push({ key: path, label: humanizeKey(path), value: formatScalar(node) });
  }

  walk(payload, "", 0);
  return rows;
}

/**
 * Decides what unit a bare irradiance number is in.
 *
 * The key name wins when it carries a hint. Otherwise magnitude decides, and
 * the ranges are the honest part of this function: an annual total and a
 * midday W/m² reading can collide around 1000, so a request that pins a single
 * timestamp — which is what getGHI sends — is read as instantaneous. `derived`
 * is set whenever that guess was involved, and the UI shows the raw number
 * alongside the interpretation.
 */
function classify(value: number, key: string): IrradianceBasis {
  const hint = key.toLowerCase();

  if (/year|annual|yr|_a$/.test(hint)) return "annual";
  if (/day|daily|dly/.test(hint)) return "daily";
  if (/w_?m2|wm2|watt|instant|now|current/.test(hint)) return "instantaneous";

  if (value <= 12) return "daily";
  if (value <= 1400) return "instantaneous";
  return "annual";
}

function toAnnual(value: number, basis: IrradianceBasis) {
  switch (basis) {
    case "annual":
      return value;
    case "daily":
      return value * 365;
    case "instantaneous":
      // W/m² at peak -> kWh/m² per day -> per year.
      return (value / 1000) * ASSUMED_PEAK_SUN_HOURS * 365;
  }
}

const UNIT_LABEL: Record<IrradianceBasis, string> = {
  annual: "kWh/m²·yr",
  daily: "kWh/m²·day",
  instantaneous: "W/m²",
};

/** Finds the first plausible irradiance number anywhere in the payload. */
export function findIrradiance(payload: unknown): IrradianceReading | null {
  const candidates = flattenReadings(payload, 200).filter((row) => GHI_KEY.test(row.key));

  for (const row of candidates) {
    const value = Number(row.value);
    if (!Number.isFinite(value) || value <= 0) {
      continue;
    }

    const basis = classify(value, row.key);

    return {
      annualKwhPerM2: Math.round(toAnnual(value, basis)),
      reportedValue: value,
      reportedUnit: UNIT_LABEL[basis],
      basis,
      derived: basis !== "annual",
      sourceKey: row.key,
    };
  }

  return null;
}
