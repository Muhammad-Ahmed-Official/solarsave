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
  paybackYear,
  years = 25,
}: {
  monthlyBill: number;
  annualCashFlows?: Array<{
    year?: number;
    netCashFlow?: number;
    grossSavings?: number;
    energyKwh?: number;
    solarEnergyKwh?: number;
    pricePerKwh?: number;
    gridCost?: number;
    leaseCost?: number;
    instantInstall?: number;
    maintenance?: number;
  }>;
  installationCost: number;
  paybackYear?: number | null;
  years?: number;
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
    const annualGridCostFromEngine =
      Number(cash?.gridCost ??
        (Number(cash?.energyKwh ?? cash?.solarEnergyKwh ?? annualBaseBill / 12) *
          Number(cash?.pricePerKwh ?? Math.max((annualBaseBill / 12) / Math.max(Number(cash?.energyKwh ?? cash?.solarEnergyKwh ?? 1), 1), 0.12))));

    const annualUtilityCost = annualGridCostFromEngine;
    const annualLeaseCost = Number(cash?.leaseCost ?? leaseAnnualPayment);
    const annualBuyCost = year === 1 ? Number(cash?.instantInstall ?? buyUpfront) : 0;

    cumulativeGrid += annualUtilityCost;
    cumulativeLease += annualLeaseCost;
    cumulativeBuy += annualBuyCost;

    points.push({
      year,
      grid: cumulativeGrid,
      buy: cumulativeBuy,
      lease: cumulativeLease,
    });
  }

  return { points, paybackYear: paybackYear ?? null };
}
