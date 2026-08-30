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
    solarEnergyKwh?: number;
    pricePerKwh?: number;
    gridCost?: number;
    leaseCost?: number;
    instantInstall?: number;
    maintenance?: number;
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
    const annualGridCostFromEngine =
      Number(cash?.gridCost ??
        (Number(cash?.energyKwh ?? cash?.solarEnergyKwh ?? annualBaseBill / 12) *
          Number(cash?.pricePerKwh ?? Math.max((annualBaseBill / 12) / Math.max(Number(cash?.energyKwh ?? cash?.solarEnergyKwh ?? 1), 1), 0.12))));

    const annualUtilityCost = annualGridCostFromEngine * Math.pow(1 + annualElectricityInflation, year - 1);
    const annualLeaseCost = Number(cash?.leaseCost ?? leaseAnnualPayment);
    const annualBuyCost = Number(cash?.instantInstall ?? buyUpfront / Math.max(years, 1));

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

  const paybackYear = points.findIndex((point) => point.year > 0 && point.lease <= point.grid) + 1 || null;

  return { points, paybackYear: paybackYear ? paybackYear : null };
}
