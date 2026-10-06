import type { ModelInputs } from './types';

/**
 * Default inputs. Everything here is an illustrative placeholder, not Cosysense customer data
 * and not a Cosysense price. Replace each value with the customer's own figures.
 */
export const baseInputs: ModelInputs = {
  facilityType: 'Quick service restaurant',
  squareFeet: 2500,
  hoursPerDay: 18,
  daysPerYear: 365,

  spendMode: 'annual',
  monthlyBill: 5000,
  annualSpend: 60000,
  annualKwh: 0,
  pricePerKwh: 0,
  hvacSharePct: 35,

  annualGasCost: 0,
  gasReductionPct: 0,
  peakDemandKw: 0,
  demandChargePerKw: 0,
  demandReductionPct: 0,
  touFactor: 1,
  escalationPct: 0,

  scenarios: { conservative: 20, base: 30, high: 38 },
  scenario: 'conservative',

  feeMode: 'none',
  feeSharePct: 0,
  feeFixedPerSite: 0,
  implementationCostPerSite: 0,

  locations: 250,
  rolloutPct: 100,
  pilotSites: 5,
  rolloutYears: 2,
};

export interface Preset {
  id: string;
  label: string;
  values: Partial<ModelInputs>;
}

export const presets: Preset[] = [
  {
    id: 'qsr',
    label: 'Quick service restaurant',
    values: { facilityType: 'Quick service restaurant', squareFeet: 2500, hoursPerDay: 18, daysPerYear: 365, annualSpend: 60000, hvacSharePct: 35, locations: 250, pilotSites: 5 },
  },
  {
    id: 'hotel',
    label: 'Hotel',
    values: { facilityType: 'Hotel', squareFeet: 60000, hoursPerDay: 24, daysPerYear: 365, annualSpend: 450000, hvacSharePct: 35, locations: 40, pilotSites: 3 },
  },
  {
    id: 'fitness',
    label: 'Fitness center',
    values: { facilityType: 'Fitness center', squareFeet: 20000, hoursPerDay: 18, daysPerYear: 360, annualSpend: 140000, hvacSharePct: 40, locations: 60, pilotSites: 4 },
  },
  {
    id: 'bigbox',
    label: 'Big box retail',
    values: { facilityType: 'Big box retail', squareFeet: 120000, hoursPerDay: 14, daysPerYear: 360, annualSpend: 600000, hvacSharePct: 35, locations: 100, pilotSites: 5 },
  },
];

export const facilityTypes = ['Quick service restaurant', 'Hotel', 'Fitness center', 'Big box retail', 'Office property', 'Other multi site operator'];
