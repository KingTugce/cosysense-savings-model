export type SpendMode = 'monthly' | 'annual' | 'kwh';
export type FeeMode = 'none' | 'share' | 'fixed';
export type ScenarioKey = 'conservative' | 'base' | 'high';
export type Mode = 'single' | 'portfolio';
export type Audience = 'customer' | 'internal';

export interface ModelInputs {
  facilityType: string;
  squareFeet: number;
  hoursPerDay: number;
  daysPerYear: number;

  spendMode: SpendMode;
  monthlyBill: number;
  annualSpend: number;
  annualKwh: number;
  pricePerKwh: number;
  hvacSharePct: number;

  annualGasCost: number;
  gasReductionPct: number;
  peakDemandKw: number;
  demandChargePerKw: number;
  demandReductionPct: number;
  touFactor: number;
  escalationPct: number;

  scenarios: Record<ScenarioKey, number>;
  scenario: ScenarioKey;

  feeMode: FeeMode;
  feeSharePct: number;
  feeFixedPerSite: number;
  implementationCostPerSite: number;

  locations: number;
  rolloutPct: number;
  pilotSites: number;
  rolloutYears: number;
}

export interface Scope {
  locations: number;
  rolloutSites: number;
  pilotSites: number;
  rolloutYears: number;
}

export interface SavingsBreakdown {
  energy: number;
  gas: number;
  demand: number;
  total: number;
}

export interface SiteYear {
  year: number;
  gross: number;
  fee: number;
  net: number;
  cumulativeNet: number;
}

export interface PortfolioYear extends SiteYear {
  liveSites: number;
  implementation: number;
}

export interface SensitivityRow {
  key: string;
  label: string;
  lowLabel: string;
  highLabel: string;
  low: number;
  base: number;
  high: number;
}

export interface ScoreWeights {
  sites: number;
  energySpend: number;
  hvacSpend: number;
  expansion: number;
  hours: number;
  savings: number;
}

export interface ScoreFullAt {
  sites: number;
  energySpend: number;
  hvacSpend: number;
  expansion: number;
  hours: number;
  savings: number;
}

export interface ScoreThresholds {
  promising: number;
  highValue: number;
  strategic: number;
}

export type ScoreCategory = 'LOW PRIORITY' | 'PROMISING' | 'HIGH VALUE' | 'STRATEGIC ACCOUNT';

export interface ScoreComponent {
  key: keyof ScoreWeights;
  label: string;
  raw: number;
  fullAt: number;
  normalized: number;
  weight: number;
  points: number;
}

export interface ScoreResult {
  components: ScoreComponent[];
  total: number;
  category: ScoreCategory;
}
