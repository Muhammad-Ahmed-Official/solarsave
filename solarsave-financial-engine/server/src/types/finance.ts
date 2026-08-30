export interface SolarAnalysisInput {
  stateCode: string;
  annualGenerationKwh: number;
  installationCost: number;
  projectYears?: number;
  annualDegradation?: number;
  electricityInflation?: number;
  annualMaintenanceCost?: number;
  maintenanceInflation?: number;
  incentives?: number;
  riskPremium?: number;
}

export interface ElectricityPrice {
  stateCode: string;
  stateName: string;
  period: string;
  centsPerKwh: number;
  dollarsPerKwh: number;
}

export interface TreasuryRate {
  date: string;
  rate: number;
  ratePercent: number;
}

export interface AnnualCashFlow {
  year: number;
  generationKwh: number;
  electricityRate: number;
  grossSavings: number;
  maintenanceCost: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
}

export interface SolarAnalysisResult {
  location: {
    stateCode: string;
    stateName: string;
  };

  electricity: ElectricityPrice;
  treasury: TreasuryRate;

  assumptions: {
    projectYears: number;
    annualDegradation: number;
    electricityInflation: number;
    annualMaintenanceCost: number;
    maintenanceInflation: number;
    incentives: number;
    riskPremium: number;
  };

  metrics: {
    netInstallationCost: number;
    discountRate: number;
    npv: number;
    irr: number | null;
    roi: number;
    paybackYears: number | null;
    lifetimeGrossSavings: number;
    lifetimeOperatingSavings: number;
    lifetimeNetProfit: number;
    financiallyAttractive: boolean | null;
  };

  annualCashFlows: AnnualCashFlow[];
}
