export type SolarComparisonPoint = {
  year: number;
  grid: number;
  buy: number;
  lease: number;
};

export type SolarComparisonSeries = {
  points: SolarComparisonPoint[];
  paybackYear: number | null;
};

export function buildSolarComparisonSeries({
  monthlyBill,
  annualCashFlows,
  installationCost,
  years = 25,
  annualElectricityInflation = 0.025,
}: {
  monthlyBill: number;
  annualCashFlows?: Array<{
    year?: number;
    netCashFlow?: number;
    grossSavings?: number;
    energyKwh?: number;
    pricePerKwh?: number;
  }>;
  installationCost: number;
  years?: number;
  annualElectricityInflation?: number;
}): SolarComparisonSeries {
  const annualBaseBill = Number(monthlyBill ?? 0) * 12;
  const buyUpfront = Number(installationCost ?? 0);
  const leaseAnnualPayment = Math.max(0, buyUpfront * 0.08);

  const points: SolarComparisonPoint[] = [{ year: 0, grid: 0, buy: 0, lease: 0 }];

  let cumulativeGrid = 0;
  let cumulativeLease = 0;
  let cumulativeBuy = 0;

  for (let year = 1; year <= years; year += 1) {
    const cash = annualCashFlows?.[year - 1];
    const annualGridCost =
      Number(cash?.energyKwh ?? annualBaseBill / 12) *
      Number(cash?.pricePerKwh ?? Math.max((annualBaseBill / 12) / Math.max(Number(cash?.energyKwh ?? 1), 1), 0.12));

    const annualUtilityCost = annualGridCost * Math.pow(1 + annualElectricityInflation, year - 1);
    const annualLeaseCost = leaseAnnualPayment;
    const annualBuyCost = buyUpfront / Math.max(years, 1);

    cumulativeGrid += annualUtilityCost;
    cumulativeLease += annualLeaseCost;
    cumulativeBuy += annualBuyCost;

    points.push({
      year,
      grid: annualUtilityCost,
      buy: annualBuyCost,
      lease: annualLeaseCost,
    });
  }

  let paybackYear: number | null = null;
  let gridTotal = 0;
  let leaseTotal = 0;

  for (const point of points) {
    if (point.year === 0) continue;
    gridTotal += point.grid;
    leaseTotal += point.lease;
    if (leaseTotal <= gridTotal) {
      paybackYear = point.year;
      break;
    }
  }

  return { points, paybackYear };
}
