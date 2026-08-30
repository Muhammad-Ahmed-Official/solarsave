/* Financial engine helper for Next.js API
 * Copied/reworked from solarsave-financial-engine package README and available EIA helper.
 * Exports: getResidentialElectricityPrice, getLatestTenYearTreasury, runSolarAnalysis
 */

export type ElectricityPrice = {
  stateCode: string;
  stateName: string;
  period: string;
  centsPerKwh: number;
  dollarsPerKwh: number;
};

export type TreasuryRate = {
  date: string;
  rate: number; // decimal, e.g., 0.0464 for 4.64%
};

export interface SolarAnalysisInput {
  stateCode: string;
  annualGenerationKwh: number;
  installationCost: number;
  monthlyBill?: number;
  annualConsumptionKwh?: number;
  ghiWattsPerM2?: number;
  peakSunHoursPerDay?: number;
  annualGenerationFormulaHours?: number;
  projectYears?: number;
  annualDegradation?: number;
  electricityInflation?: number;
  annualMaintenanceCost?: number;
  maintenanceInflation?: number;
  incentives?: number;
  riskPremium?: number;
}

export type AnnualCashFlowRow = {
  year: number;
  solarEnergyKwh: number;
  pricePerKwh: number;
  grossSavings: number;
  maintenance: number;
  netCashFlow: number;
  instantInstall: number;
  gridCost: number;
  leaseCost: number;
  energyKwh?: number;
  annualConsumptionKwh?: number;
  annualGenerationKwh?: number;
  maintenanceCost?: number;
};

export type SolarAnalysisResult = {
  location: { stateCode: string };
  electricity: ElectricityPrice;
  treasury: TreasuryRate;
  assumptions: Record<string, unknown>;
  metrics: Record<string, number | string | boolean>;
  annualCashFlows: AnnualCashFlowRow[];
};

// --- EIA electricity price ---
const eiaUrl = "https://api.eia.gov/v2/electricity/retail-sales/data/";

type EiaRow = {
  period: string;
  stateid: string;
  stateDescription: string;
  sectorid: string;
  price: string | number;
};

type EiaResponse = {
  response?: {
    data?: EiaRow[];
  };
};

const stateCodes: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
  "district of columbia": "DC",
};

const priceCache = new Map<string, { value: ElectricityPrice; expiresAt: number }>();
const priceCacheTime = 12 * 60 * 60 * 1000; // 12 hours

export function normalizeState(value: string) {
  const cleaned = String(value).trim();
  if (/^[A-Za-z]{2}$/.test(cleaned)) return cleaned.toUpperCase();
  const code = stateCodes[cleaned.toLowerCase()];
  if (!code) throw new Error("Invalid US state");
  return code;
}

export async function getResidentialElectricityPrice(stateValue: string): Promise<ElectricityPrice> {
  const apiKey = process.env.EIA_API_KEY;
  if (!apiKey) throw new Error("EIA_API_KEY is missing");

  const state = normalizeState(stateValue);
  const cached = priceCache.get(state);
  if (cached && Date.now() < cached.expiresAt) return cached.value;

  const params = new URLSearchParams();
  params.set("api_key", apiKey);
  params.append("data[]", "price");
  params.append("facets[stateid][]", state);
  params.append("facets[sectorid][]", "RES");
  params.set("frequency", "monthly");
  params.set("sort[0][column]", "period");
  params.set("sort[0][direction]", "desc");
  params.set("length", "1");

  const response = await fetch(`${eiaUrl}?${params.toString()}`);
  if (!response.ok) throw new Error(`EIA request failed with status ${response.status}`);
  const body = (await response.json()) as EiaResponse;
  const latest = body.response?.data?.[0];
  if (!latest) throw new Error(`No residential electricity data found for ${state}`);

  const centsPerKwh = Number(latest.price);
  if (!Number.isFinite(centsPerKwh)) throw new Error("Invalid electricity price returned by EIA");
  const dollarsPerKwh = Math.round((centsPerKwh / 100) * 10000) / 10000;

  const value: ElectricityPrice = {
    stateCode: latest.stateid,
    stateName: latest.stateDescription,
    period: latest.period,
    centsPerKwh,
    dollarsPerKwh,
  };

  priceCache.set(state, { value, expiresAt: Date.now() + priceCacheTime });
  return value;
}

// --- Treasury rate (FRED) ---
// Use the FRED CSV endpoint for DGS10: returns rows with DATE, DGS10
const fredCsvUrl = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10";
const treasuryCache = { value: null as TreasuryRate | null, expiresAt: 0 };
const treasuryCacheTime = 6 * 60 * 60 * 1000; // 6 hours

export async function getLatestTenYearTreasury(): Promise<TreasuryRate> {
  if (treasuryCache.value && Date.now() < treasuryCache.expiresAt) return treasuryCache.value;

  const res = await fetch(fredCsvUrl);
  if (!res.ok) throw new Error(`FRED request failed ${res.status}`);
  const text = await res.text();

  // parse CSV, find last non-empty value
  const lines = text.trim().split(/\r?\n/);
  // header is DATE,DGS10
  for (let i = lines.length - 1; i >= 1; i--) {
    const cols = lines[i].split(",");
    const date = cols[0];
    const raw = cols[1];
    if (!raw || raw === ".") continue;
    const v = Number(raw);
    if (!Number.isFinite(v)) continue;
    const rate = v / 100; // convert percent to decimal
    const out: TreasuryRate = { date, rate };
    treasuryCache.value = out;
    treasuryCache.expiresAt = Date.now() + treasuryCacheTime;
    return out;
  }

  throw new Error("No valid 10Y treasury observation found");
}

// --- Financial model ---
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function solveIrr(cashFlows: number[]) {
  // Use bisection between -0.999 and 10
  let low = -0.999999;
  let high = 10;
  const npv = (r: number) => {
    return cashFlows.reduce((s, cf, i) => s + cf / Math.pow(1 + r, i), 0);
  };

  let fLow = npv(low);
  let fHigh = npv(high);
  if (isNaN(fLow) || isNaN(fHigh)) return NaN;
  if (fLow === 0) return low;
  if (fHigh === 0) return high;

  // Ensure bracket
  for (let i = 0; i < 200 && fLow * fHigh > 0; i++) {
    // expand high
    high *= 2;
    fHigh = npv(high);
    if (!isFinite(fHigh)) break;
  }

  if (fLow * fHigh > 0) return NaN;

  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const fMid = npv(mid);
    if (Math.abs(fMid) < 1e-8) return mid;
    if (fMid * fLow < 0) {
      high = mid;
      fHigh = fMid;
    } else {
      low = mid;
      fLow = fMid;
    }
  }
  return (low + high) / 2;
}

export function runSolarAnalysis(
  input: SolarAnalysisInput,
  electricity: ElectricityPrice,
  treasury: TreasuryRate
): SolarAnalysisResult {
  const years = Number(input.projectYears ?? 25);
  const degradation = Number(input.annualDegradation ?? 0.005);
  const inflation = Number(input.electricityInflation ?? 0.025);
  const maintenance = Number(input.annualMaintenanceCost ?? 0);
  const maintenanceInflation = Number(input.maintenanceInflation ?? 0.025);
  const incentives = Number(input.incentives ?? 0);
  const riskPremium = Number(input.riskPremium ?? 0.02);
  const annualConsumptionKwhInput = Number(input.annualConsumptionKwh);
  const annualConsumptionKwh = Number.isFinite(annualConsumptionKwhInput)
    ? annualConsumptionKwhInput
    : Number.isFinite(Number(input.monthlyBill))
      ? (Number(input.monthlyBill) * 12) / Math.max(electricity.dollarsPerKwh, 0.0001)
      : null;

  const E1 = Number(input.annualGenerationKwh);
  const installCost = Number(input.installationCost);
  if (!Number.isFinite(E1) || !Number.isFinite(installCost)) {
    throw new RangeError("Invalid numeric input for generation or cost");
  }

  const discountRate = treasury.rate + riskPremium;
  const netInstallationCost = installCost - incentives;

  const annualRows: AnnualCashFlowRow[] = [];
  let cumulativeUndiscounted = -netInstallationCost;
  let paybackYears: number | null = null;
  const cashFlows: number[] = [];
  // year 0 is the negative installation cost
  cashFlows.push(-netInstallationCost);

  let lifetimeGrossSavings = 0;
  let lifetimeOperatingSavings = 0;

  for (let t = 1; t <= years; t++) {
    const energy = E1 * Math.pow(1 - degradation, t - 1);
    const price = electricity.dollarsPerKwh * Math.pow(1 + inflation, t - 1);
    const gross = energy * price;
    const maint = maintenance * Math.pow(1 + maintenanceInflation, t - 1);
    const cf = gross - maint;
    const gridCost = (annualConsumptionKwh ?? 0) * price;
    const leaseCost = (installCost * 0.08) || 0;
    const instantInstall = netInstallationCost;

    annualRows.push({
      year: t,
      solarEnergyKwh: round2(energy),
      pricePerKwh: round2(price),
      grossSavings: round2(gross),
      maintenance: round2(maint),
      netCashFlow: round2(cf),
      instantInstall: round2(instantInstall),
      gridCost: round2(gridCost),
      leaseCost: round2(leaseCost),
      energyKwh: round2(energy),
      annualConsumptionKwh: annualConsumptionKwh !== null ? round2(annualConsumptionKwh) : undefined,
      annualGenerationKwh: round2(energy),
      maintenanceCost: round2(maint),
    });

    cashFlows.push(cf);

    lifetimeGrossSavings += gross;
    lifetimeOperatingSavings += cf;

    cumulativeUndiscounted += cf;
    if (paybackYears === null && cumulativeUndiscounted >= 0) {
      paybackYears = t;
    }
  }

  // NPV discounted at discountRate
  const npv = cashFlows.reduce((s, cf, i) => s + cf / Math.pow(1 + discountRate, i), 0);
  const irr = solveIrr(cashFlows);

  const lifetimeNetProfit = lifetimeOperatingSavings - netInstallationCost;
  const roi = netInstallationCost !== 0 ? lifetimeNetProfit / Math.abs(netInstallationCost) : NaN;

  const result: SolarAnalysisResult = {
    location: { stateCode: input.stateCode },
    electricity,
    treasury,
    assumptions: {
      projectYears: years,
      annualDegradation: degradation,
      electricityInflation: inflation,
      annualMaintenanceCost: maintenance,
      maintenanceInflation,
      incentives,
      riskPremium,
      discountRate,
      annualConsumptionKwh,
      annualGenerationKwh: E1,
      ghiWattsPerM2: Number.isFinite(Number(input.ghiWattsPerM2)) ? Number(input.ghiWattsPerM2) : null,
      peakSunHoursPerDay: Number.isFinite(Number(input.peakSunHoursPerDay)) ? Number(input.peakSunHoursPerDay) : null,
      annualGenerationFormulaHours: Number.isFinite(Number(input.annualGenerationFormulaHours)) ? Number(input.annualGenerationFormulaHours) : null,
    },
    metrics: {
      netInstallationCost: round2(netInstallationCost),
      discountRate: round2(discountRate),
      npv: round2(npv),
      irr: Number.isFinite(irr) ? irr : NaN,
      roi: Number.isFinite(roi) ? roi : NaN,
      paybackYears: paybackYears ?? -1,
      lifetimeGrossSavings: round2(lifetimeGrossSavings),
      lifetimeOperatingSavings: round2(lifetimeOperatingSavings),
      lifetimeNetProfit: round2(lifetimeNetProfit),
      financiallyAttractive: npv > 0,
      annualConsumptionKwh: annualConsumptionKwh !== null ? round2(annualConsumptionKwh) : 0,
      annualGenerationKwh: round2(E1),
      ghiWattsPerM2: Number.isFinite(Number(input.ghiWattsPerM2)) ? round2(Number(input.ghiWattsPerM2)) : 0,
      peakSunHoursPerDay: Number.isFinite(Number(input.peakSunHoursPerDay)) ? round2(Number(input.peakSunHoursPerDay)) : 0,
      annualGenerationFormulaHours: Number.isFinite(Number(input.annualGenerationFormulaHours)) ? round2(Number(input.annualGenerationFormulaHours)) : 0,
    },
    annualCashFlows: annualRows,
  };

  return result;
}
