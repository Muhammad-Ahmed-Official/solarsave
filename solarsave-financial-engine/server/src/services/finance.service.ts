import {
  AnnualCashFlow,
  ElectricityPrice,
  SolarAnalysisInput,
  SolarAnalysisResult,
  TreasuryRate,
} from "../types/finance";

const defaults = {
  projectYears: 25,
  annualDegradation: 0.005,
  electricityInflation: 0.025,
  annualMaintenanceCost: 0,
  maintenanceInflation: 0.025,
  incentives: 0,
  riskPremium: 0.02,
};

function round(value: number, digits = 2) {
  const multiplier = Math.pow(10, digits);
  return Math.round(value * multiplier) / multiplier;
}

function validateInput(input: SolarAnalysisInput) {
  if (
    !Number.isFinite(input.annualGenerationKwh) ||
    input.annualGenerationKwh <= 0
  ) {
    throw new RangeError("Annual generation must be greater than zero");
  }

  if (
    !Number.isFinite(input.installationCost) ||
    input.installationCost <= 0
  ) {
    throw new RangeError("Installation cost must be greater than zero");
  }
}

export function calculateNPV(
  cashFlows: number[],
  discountRate: number
) {
  return cashFlows.reduce((total, cashFlow, year) => {
    return total + cashFlow / Math.pow(1 + discountRate, year);
  }, 0);
}

export function calculateIRR(cashFlows: number[]) {
  let low = -0.9999;
  let high = 1;

  let lowValue = calculateNPV(cashFlows, low);
  let highValue = calculateNPV(cashFlows, high);

  while (lowValue * highValue > 0 && high < 100) {
    high *= 2;
    highValue = calculateNPV(cashFlows, high);
  }

  if (lowValue * highValue > 0) {
    return null;
  }

  for (let i = 0; i < 150; i++) {
    const middle = (low + high) / 2;
    const middleValue = calculateNPV(cashFlows, middle);

    if (Math.abs(middleValue) < 0.000001) {
      return middle;
    }

    if (lowValue * middleValue <= 0) {
      high = middle;
    } else {
      low = middle;
      lowValue = middleValue;
    }
  }

  return (low + high) / 2;
}

export function calculatePaybackPeriod(cashFlows: number[]) {
  if (cashFlows.length === 0) {
    return null;
  }

  let cumulative = cashFlows[0] ?? 0;

  for (let year = 1; year < cashFlows.length; year++) {
    const currentCashFlow = cashFlows[year];

    if (currentCashFlow === undefined) {
      continue;
    }

    const before = cumulative;
    cumulative += currentCashFlow;

    if (cumulative >= 0) {
      if (currentCashFlow <= 0) {
        return year;
      }

      const fraction = Math.abs(before) / currentCashFlow;
      return year - 1 + fraction;
    }
  }

  return null;
}

export function runSolarAnalysis(
  input: SolarAnalysisInput,
  electricity: ElectricityPrice,
  treasury: TreasuryRate
): SolarAnalysisResult {
  validateInput(input);

  const assumptions = {
    projectYears: input.projectYears ?? defaults.projectYears,
    annualDegradation:
      input.annualDegradation ?? defaults.annualDegradation,
    electricityInflation:
      input.electricityInflation ?? defaults.electricityInflation,
    annualMaintenanceCost:
      input.annualMaintenanceCost ?? defaults.annualMaintenanceCost,
    maintenanceInflation:
      input.maintenanceInflation ?? defaults.maintenanceInflation,
    incentives: input.incentives ?? defaults.incentives,
    riskPremium: input.riskPremium ?? defaults.riskPremium,
  };

  if (
    !Number.isInteger(assumptions.projectYears) ||
    assumptions.projectYears < 1 ||
    assumptions.projectYears > 50
  ) {
    throw new RangeError("Project years must be between 1 and 50");
  }

  if (
    assumptions.annualDegradation < 0 ||
    assumptions.annualDegradation >= 1
  ) {
    throw new RangeError("Annual degradation must be between 0 and 1");
  }

  if (assumptions.incentives < 0) {
    throw new RangeError("Incentives cannot be negative");
  }

  const netInstallationCost = Math.max(
    input.installationCost - assumptions.incentives,
    0
  );

  const annualCashFlows: AnnualCashFlow[] = [];
  const cashFlows: number[] = [-netInstallationCost];

  let cumulativeCashFlow = -netInstallationCost;

  for (let year = 1; year <= assumptions.projectYears; year++) {
    const generationKwh =
      input.annualGenerationKwh *
      Math.pow(1 - assumptions.annualDegradation, year - 1);

    const electricityRate =
      electricity.dollarsPerKwh *
      Math.pow(1 + assumptions.electricityInflation, year - 1);

    const grossSavings = generationKwh * electricityRate;

    const maintenanceCost =
      assumptions.annualMaintenanceCost *
      Math.pow(1 + assumptions.maintenanceInflation, year - 1);

    const netCashFlow = grossSavings - maintenanceCost;

    cumulativeCashFlow += netCashFlow;
    cashFlows.push(netCashFlow);

    const monthlyBill = input.monthlyBill ?? (Math.max(generationKwh, 1) * electricityRate) / 12;
    const leaseCost = Math.max(0, netInstallationCost * 0.08);
    const instantInstall = netInstallationCost;
    const gridCost = monthlyBill * 12 * Math.pow(1 + assumptions.electricityInflation, year - 1);

    annualCashFlows.push({
      year,
      solarEnergyKwh: round(generationKwh),
      pricePerKwh: round(electricityRate, 4),
      grossSavings: round(grossSavings),
      maintenance: round(maintenanceCost),
      netCashFlow: round(netCashFlow),
      instantInstall: round(instantInstall),
      gridCost: round(gridCost),
      leaseCost: round(leaseCost),
      generationKwh: round(generationKwh),
      electricityRate: round(electricityRate, 4),
      maintenanceCost: round(maintenanceCost),
      cumulativeCashFlow: round(cumulativeCashFlow),
    });
  }

  const discountRate = treasury.rate + assumptions.riskPremium;
  const npv = calculateNPV(cashFlows, discountRate);
  const irr = calculateIRR(cashFlows);
  const paybackYears = calculatePaybackPeriod(cashFlows);

  const lifetimeGrossSavings = annualCashFlows.reduce(
    (total, year) => total + year.grossSavings,
    0
  );

  const lifetimeOperatingSavings = annualCashFlows.reduce(
    (total, year) => total + year.netCashFlow,
    0
  );

  const lifetimeNetProfit =
    lifetimeOperatingSavings - netInstallationCost;

  const roi =
    netInstallationCost > 0
      ? lifetimeNetProfit / netInstallationCost
      : 0;

  return {
    location: {
      stateCode: electricity.stateCode,
      stateName: electricity.stateName,
    },
    electricity,
    treasury,
    assumptions,
    metrics: {
      netInstallationCost: round(netInstallationCost),
      discountRate: round(discountRate, 6),
      npv: round(npv),
      irr: irr === null ? null : round(irr, 6),
      roi: round(roi, 6),
      paybackYears:
        paybackYears === null ? null : round(paybackYears, 2),
      lifetimeGrossSavings: round(lifetimeGrossSavings),
      lifetimeOperatingSavings: round(lifetimeOperatingSavings),
      lifetimeNetProfit: round(lifetimeNetProfit),
      financiallyAttractive:
        irr === null ? null : npv > 0 && irr > discountRate,
    },
    annualCashFlows,
  };
}
