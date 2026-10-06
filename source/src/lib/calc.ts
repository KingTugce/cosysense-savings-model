import type {
  Mode,
  ModelInputs,
  PortfolioYear,
  SavingsBreakdown,
  Scope,
  ScenarioKey,
  SensitivityRow,
  SiteYear,
} from './types';

/**
 * Pure calculation functions. No UI, no storage, no network.
 * Every function takes plain numbers or the ModelInputs object and returns plain numbers,
 * so the same logic can be ported to Python or an API without change.
 */

const finite = (n: number): number => (Number.isFinite(n) ? n : 0);
export const clamp = (n: number, lo: number, hi: number): number => Math.min(Math.max(n, lo), hi);

/** Annual electricity spend from whichever entry method the user chose. */
export function annualElectricitySpend(i: ModelInputs): number {
  let v = 0;
  if (i.spendMode === 'monthly') v = finite(i.monthlyBill) * 12;
  else if (i.spendMode === 'annual') v = finite(i.annualSpend);
  else v = finite(i.annualKwh) * finite(i.pricePerKwh);
  return Math.max(v, 0);
}

/**
 * Annual demand charges, assuming the entered peak and rate repeat in every billing month.
 * Capped at total electricity spend so the model never counts more demand cost than the bill holds.
 */
export function annualDemandCharges(i: ModelInputs): number {
  const d = finite(i.peakDemandKw) * finite(i.demandChargePerKw) * 12;
  return clamp(d, 0, annualElectricitySpend(i));
}

/** Electricity spend excluding demand charges. Demand charges are modeled separately to avoid double counting. */
export function energyChargeSpend(i: ModelInputs): number {
  return Math.max(annualElectricitySpend(i) - annualDemandCharges(i), 0);
}

/** Estimated annual HVAC related electricity spend (energy charges only). */
export function hvacSpend(i: ModelInputs): number {
  return energyChargeSpend(i) * (clamp(finite(i.hvacSharePct), 0, 100) / 100);
}

/** The reduction percentage of the selected scenario. */
export function selectedReduction(i: ModelInputs): number {
  return clamp(finite(i.scenarios[i.scenario]), 0, 100);
}

/** Gross annual savings for one site in year one, split by source. */
export function grossSavings(i: ModelInputs, reductionPct: number = selectedReduction(i)): SavingsBreakdown {
  const r = clamp(finite(reductionPct), 0, 100) / 100;
  const tou = Math.max(finite(i.touFactor), 0);
  const energy = hvacSpend(i) * r * tou;
  const gas = Math.max(finite(i.annualGasCost), 0) * (clamp(finite(i.gasReductionPct), 0, 100) / 100);
  const demand = annualDemandCharges(i) * (clamp(finite(i.demandReductionPct), 0, 100) / 100);
  return { energy, gas, demand, total: energy + gas + demand };
}

/** True when the user has entered a fee assumption. */
export function feeEntered(i: ModelInputs): boolean {
  if (i.feeMode === 'share') return finite(i.feeSharePct) > 0;
  if (i.feeMode === 'fixed') return finite(i.feeFixedPerSite) > 0;
  return false;
}

/** Annual Cosysense fee for one site, given that site's gross savings for the year. */
export function annualFeePerSite(i: ModelInputs, grossForYear: number): number {
  if (i.feeMode === 'share') return Math.max(grossForYear, 0) * (clamp(finite(i.feeSharePct), 0, 100) / 100);
  if (i.feeMode === 'fixed') return Math.max(finite(i.feeFixedPerSite), 0);
  return 0;
}

/** Net annual customer savings for one site. */
export function netSavings(i: ModelInputs, grossForYear: number): number {
  return grossForYear - annualFeePerSite(i, grossForYear);
}

/** Payback in months on implementation cost. Returns null when no cost is entered, Infinity when net savings are not positive. */
export function paybackMonths(implementationCost: number, netAnnual: number): number | null {
  const c = finite(implementationCost);
  if (c <= 0) return null;
  if (netAnnual <= 0) return Infinity;
  return (c / netAnnual) * 12;
}

/** Gross savings in a given year after electricity cost escalation (year 1 has no escalation). */
export function escalatedGross(grossYear1: number, escalationPct: number, year: number): number {
  return grossYear1 * Math.pow(1 + finite(escalationPct) / 100, Math.max(year - 1, 0));
}

/** Year by year projection for one site. Cumulative net is reduced by one time implementation cost. */
export function projectSite(i: ModelInputs, years = 5, reductionPct: number = selectedReduction(i)): SiteYear[] {
  const g1 = grossSavings(i, reductionPct).total;
  const rows: SiteYear[] = [];
  let cumulative = -Math.max(finite(i.implementationCostPerSite), 0);
  for (let y = 1; y <= years; y++) {
    const gross = escalatedGross(g1, i.escalationPct, y);
    const fee = annualFeePerSite(i, gross);
    const net = gross - fee;
    cumulative += net;
    rows.push({ year: y, gross, fee, net, cumulativeNet: cumulative });
  }
  return rows;
}

export const threeYearSite = (i: ModelInputs, r?: number): number => projectSite(i, 3, r)[2].cumulativeNet;
export const fiveYearSite = (i: ModelInputs, r?: number): number => projectSite(i, 5, r)[4].cumulativeNet;

/** Build the scope (how many sites) for the chosen mode. */
export function resolveScope(i: ModelInputs, mode: Mode): Scope {
  if (mode === 'single') return { locations: 1, rolloutSites: 1, pilotSites: 1, rolloutYears: 1 };
  const locations = Math.max(1, Math.round(finite(i.locations)));
  const rolloutSites = clamp(Math.round((locations * clamp(finite(i.rolloutPct), 0, 100)) / 100), 1, locations);
  const pilotSites = clamp(Math.round(finite(i.pilotSites)), 1, rolloutSites);
  const rolloutYears = Math.max(1, finite(i.rolloutYears));
  return { locations, rolloutSites, pilotSites, rolloutYears };
}

/**
 * Sites live in a given year. Pilot sites are live from year one. The remaining rollout sites
 * are added in equal steps at the start of each year across the rollout period.
 */
export function liveSites(scope: Scope, year: number): number {
  const { pilotSites, rolloutSites, rolloutYears } = scope;
  const share = Math.min(1, year / rolloutYears);
  return pilotSites + (rolloutSites - pilotSites) * share;
}

/** Year by year projection across the portfolio, including the ramp and one time implementation cost for sites as they go live. */
export function projectPortfolio(
  i: ModelInputs,
  scope: Scope,
  years = 5,
  reductionPct: number = selectedReduction(i),
): PortfolioYear[] {
  const g1 = grossSavings(i, reductionPct).total;
  const implCost = Math.max(finite(i.implementationCostPerSite), 0);
  const rows: PortfolioYear[] = [];
  let cumulative = 0;
  let previousLive = 0;
  for (let y = 1; y <= years; y++) {
    const live = liveSites(scope, y);
    const grossPerSite = escalatedGross(g1, i.escalationPct, y);
    const gross = grossPerSite * live;
    const fee = annualFeePerSite(i, grossPerSite) * live;
    const implementation = (live - previousLive) * implCost;
    const net = gross - fee;
    cumulative += net - implementation;
    rows.push({ year: y, gross, fee, net, cumulativeNet: cumulative, liveSites: live, implementation });
    previousLive = live;
  }
  return rows;
}

export const threeYearPortfolio = (i: ModelInputs, s: Scope, r?: number): number => projectPortfolio(i, s, 3, r)[2].cumulativeNet;
export const fiveYearPortfolio = (i: ModelInputs, s: Scope, r?: number): number => projectPortfolio(i, s, 5, r)[4].cumulativeNet;

/** Steady state annual numbers at full rollout, year one prices, no ramp. */
export function runRate(i: ModelInputs, sites: number, reductionPct: number = selectedReduction(i)) {
  const g = grossSavings(i, reductionPct).total;
  const feePerSite = annualFeePerSite(i, g);
  return {
    gross: g * sites,
    fee: feePerSite * sites,
    net: (g - feePerSite) * sites,
    netPerSite: g - feePerSite,
  };
}

/** Value created by going from the pilot sites to the full rollout, at steady state. */
export function expansionValue(i: ModelInputs, scope: Scope): number {
  const full = runRate(i, scope.rolloutSites).net;
  const pilot = runRate(i, scope.pilotSites).net;
  return full - pilot;
}

/** What the same per site economics are worth at different portfolio sizes. */
export function scaleLadder(i: ModelInputs, sizes: number[] = [1, 10, 100, 500]) {
  return sizes.map((n) => {
    const scope: Scope = { locations: n, rolloutSites: n, pilotSites: n, rolloutYears: 1 };
    const rows = projectPortfolio(i, scope, 5);
    const feeFiveYear = rows.reduce((s, r) => s + r.fee, 0);
    return {
      sites: n,
      annualNet: runRate(i, n).net,
      fiveYearNet: rows[4].cumulativeNet,
      fiveYearFees: feeFiveYear,
    };
  });
}

/** Scale the price related inputs by a factor. Used by the sensitivity analysis. */
export function withPriceFactor(i: ModelInputs, f: number): ModelInputs {
  return {
    ...i,
    monthlyBill: i.monthlyBill * f,
    annualSpend: i.annualSpend * f,
    pricePerKwh: i.pricePerKwh * f,
    demandChargePerKw: i.demandChargePerKw * f,
  };
}

/** The value the sensitivity analysis measures: five year net customer value for the chosen scope. */
const outcome = (i: ModelInputs, s: Scope, r?: number): number => fiveYearPortfolio(i, s, r);

/**
 * One at a time sensitivity on the five year net customer value.
 * Each driver is moved to a low and a high value while everything else stays at its current setting.
 */
export function sensitivity(
  i: ModelInputs,
  scope: Scope,
  opts: { pricePct?: number; sharePoints?: number; sitesPct?: number } = {},
): SensitivityRow[] {
  const pricePct = opts.pricePct ?? 20;
  const sharePoints = opts.sharePoints ?? 10;
  const sitesPct = opts.sitesPct ?? 50;
  const base = outcome(i, scope);

  const priceLow = outcome(withPriceFactor(i, 1 - pricePct / 100), scope);
  const priceHigh = outcome(withPriceFactor(i, 1 + pricePct / 100), scope);

  const shareLowV = clamp(i.hvacSharePct - sharePoints, 0, 100);
  const shareHighV = clamp(i.hvacSharePct + sharePoints, 0, 100);
  const shareLow = outcome({ ...i, hvacSharePct: shareLowV }, scope);
  const shareHigh = outcome({ ...i, hvacSharePct: shareHighV }, scope);

  const redLowV = i.scenarios.conservative;
  const redHighV = i.scenarios.high;
  const redLow = outcome(i, scope, redLowV);
  const redHigh = outcome(i, scope, redHighV);

  const sitesLowN = Math.max(scope.pilotSites, Math.round(scope.rolloutSites * (1 - sitesPct / 100)));
  const sitesHighN = Math.round(scope.rolloutSites * (1 + sitesPct / 100));
  const sitesLow = outcome(i, { ...scope, rolloutSites: sitesLowN }, undefined);
  const sitesHigh = outcome(i, { ...scope, rolloutSites: sitesHighN }, undefined);

  return [
    { key: 'reduction', label: 'Expected HVAC reduction', lowLabel: `${redLowV}%`, highLabel: `${redHighV}%`, low: redLow, base, high: redHigh },
    { key: 'share', label: 'HVAC share of electricity', lowLabel: `${shareLowV}%`, highLabel: `${shareHighV}%`, low: shareLow, base, high: shareHigh },
    { key: 'price', label: 'Electricity price', lowLabel: `minus ${pricePct}%`, highLabel: `plus ${pricePct}%`, low: priceLow, base, high: priceHigh },
    { key: 'sites', label: 'Number of sites rolled out (plus or minus 50%)', lowLabel: `${sitesLowN}`, highLabel: `${sitesHighN}`, low: sitesLow, base, high: sitesHigh },
  ];
}

/** Compare the three scenarios on steady state annual net savings and five year net value. */
export function scenarioComparison(i: ModelInputs, scope: Scope) {
  const keys: ScenarioKey[] = ['conservative', 'base', 'high'];
  return keys.map((k) => ({
    key: k,
    reductionPct: i.scenarios[k],
    annualNet: runRate(i, scope.rolloutSites, i.scenarios[k]).net,
    fiveYearNet: fiveYearPortfolio(i, scope, i.scenarios[k]),
  }));
}
