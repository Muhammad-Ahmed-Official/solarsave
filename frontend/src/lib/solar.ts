type SolarInputs = {
  /** Annual global horizontal irradiance, kWh/m² per year */
  ghi: number;
  /** Panel array area, m² */
  area: number;
  /** Module efficiency, percent */
  efficiency: number;
  /** Electricity tariff, currency per kWh */
  tariff: number;
  /** Installed cost, currency per kW */
  costPerKw: number;
};

/** Monthly share of annual irradiance for a northern mid-latitude site. */
const MONTH_SHARE = [
  0.045, 0.055, 0.075, 0.09, 0.105, 0.112, 0.113, 0.105, 0.086, 0.07, 0.05, 0.044,
];

export const MONTH_LABELS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

/** Southern-hemisphere sites peak in December, not June. */
function monthShareForLatitude(latitude: number) {
  return latitude < 0 ? [...MONTH_SHARE.slice(6), ...MONTH_SHARE.slice(0, 6)] : MONTH_SHARE;
}

/** Performance ratio: inverter, wiring, temperature and soiling losses. */
const PERFORMANCE_RATIO = 0.82;
/** Grid carbon intensity, tonnes CO2 per MWh. */
const CO2_PER_MWH = 0.41;
/** Annual tariff escalation. */
const TARIFF_ESCALATION = 0.035;
/** Annual module degradation. */
const DEGRADATION = 0.005;
/** Horizon of the forecast, in years. */
const HORIZON_YEARS = 25;

export const SYSTEM_DEFAULTS = {
  area: 28,
  efficiency: 21.4,
  tariff: 0.14,
  costPerKw: 1450,
} as const;

export function computeSolar(input: SolarInputs & { latitude?: number }) {
  const { ghi, area, efficiency, tariff, costPerKw, latitude = 0 } = input;

  // Rated at the 1 kW/m² STC reference irradiance.
  const capacityKw = (area * efficiency) / 100;
  const annualKwh = ghi * area * (efficiency / 100) * PERFORMANCE_RATIO;
  const monthlyKwh = monthShareForLatitude(latitude).map((s) => annualKwh * s);
  const peakSunHours = ghi / 365;
  const firstYearSavings = annualKwh * tariff;
  const systemCost = capacityKw * costPerKw;
  const co2Tonnes = (annualKwh / 1000) * CO2_PER_MWH;

  const years: { year: number; grid: number; solar: number; cumulative: number }[] = [];
  let cumulative = -systemCost;
  let cumGrid = 0;
  let payback = 0;

  for (let y = 1; y <= HORIZON_YEARS; y++) {
    const rate = tariff * Math.pow(1 + TARIFF_ESCALATION, y - 1);
    const production = annualKwh * Math.pow(1 - DEGRADATION, y - 1);
    // What this year's output would otherwise have cost at grid prices, which
    // is exactly what the system saves.
    const saving = production * rate;
    const prev = cumulative;

    cumulative += saving;
    if (payback === 0 && prev < 0 && cumulative >= 0 && saving > 0) {
      payback = y - 1 + Math.abs(prev) / saving;
    }

    cumGrid += saving;
    // Cumulative outlay under each option: the grid bill keeps accruing, the
    // solar system is a single up-front cost.
    years.push({ year: y, grid: cumGrid, solar: systemCost, cumulative });
  }

  const lifetimeNet = cumulative;
  const roi = systemCost > 0 ? ((lifetimeNet + systemCost) / systemCost) * 100 : 0;

  return {
    capacityKw,
    annualKwh,
    monthlyKwh,
    peakSunHours,
    firstYearSavings,
    systemCost,
    co2Tonnes,
    payback,
    lifetimeNet,
    roi,
    years,
    panels: Math.max(1, Math.round(area / 2)),
  };
}

export type SolarResult = ReturnType<typeof computeSolar>;

export const currency = (n: number, digits = 0) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
