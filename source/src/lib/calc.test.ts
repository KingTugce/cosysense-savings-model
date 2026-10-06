import { describe, expect, it } from 'vitest';
import {
  annualDemandCharges,
  annualElectricitySpend,
  annualFeePerSite,
  expansionValue,
  fiveYearPortfolio,
  fiveYearSite,
  grossSavings,
  hvacSpend,
  liveSites,
  netSavings,
  paybackMonths,
  projectPortfolio,
  projectSite,
  resolveScope,
  runRate,
  scaleLadder,
  sensitivity,
  threeYearSite,
  withPriceFactor,
} from './calc';
import { baseInputs } from './presets';
import { categorize, defaultThresholds, defaultWeights, scoreAccount } from './score';
import type { ModelInputs } from './types';

// Round numbers keep the arithmetic easy to verify by hand.
const mk = (over: Partial<ModelInputs> = {}): ModelInputs => ({
  ...baseInputs,
  spendMode: 'annual',
  annualSpend: 100000,
  hvacSharePct: 40,
  scenarios: { conservative: 20, base: 30, high: 40 },
  scenario: 'base',
  escalationPct: 0,
  implementationCostPerSite: 0,
  feeMode: 'none',
  feeSharePct: 0,
  feeFixedPerSite: 0,
  ...over,
});

describe('electricity spend', () => {
  it('uses the annual figure', () => expect(annualElectricitySpend(mk())).toBe(100000));
  it('converts a monthly bill', () => expect(annualElectricitySpend(mk({ spendMode: 'monthly', monthlyBill: 5000 }))).toBe(60000));
  it('multiplies kWh by price', () => expect(annualElectricitySpend(mk({ spendMode: 'kwh', annualKwh: 400000, pricePerKwh: 0.25 }))).toBe(100000));
  it('never returns a negative value', () => expect(annualElectricitySpend(mk({ annualSpend: -5 }))).toBe(0));
});

describe('HVAC spend', () => {
  it('applies the HVAC share', () => expect(hvacSpend(mk())).toBe(40000));
  it('clamps the share to 100 percent', () => expect(hvacSpend(mk({ hvacSharePct: 150 }))).toBe(100000));
  it('excludes demand charges from HVAC energy spend', () => {
    const i = mk({ peakDemandKw: 50, demandChargePerKw: 20 }); // 50 * 20 * 12 = 12,000
    expect(annualDemandCharges(i)).toBe(12000);
    expect(hvacSpend(i)).toBeCloseTo(0.4 * 88000, 6);
  });
  it('caps demand charges at total electricity spend', () => {
    expect(annualDemandCharges(mk({ peakDemandKw: 10000, demandChargePerKw: 50 }))).toBe(100000);
  });
});

describe('gross savings', () => {
  it('applies the selected scenario reduction', () => expect(grossSavings(mk()).total).toBe(12000));
  it('can use an explicit reduction', () => expect(grossSavings(mk(), 38).total).toBeCloseTo(15200, 6));
  it('applies the time of use factor to energy savings', () => expect(grossSavings(mk({ touFactor: 1.5 })).energy).toBe(18000));
  it('adds gas savings only when a reduction is entered', () => {
    expect(grossSavings(mk({ annualGasCost: 10000 })).gas).toBe(0);
    expect(grossSavings(mk({ annualGasCost: 10000, gasReductionPct: 10 })).gas).toBe(1000);
  });
  it('adds demand savings separately from energy savings', () => {
    const g = grossSavings(mk({ peakDemandKw: 50, demandChargePerKw: 20, demandReductionPct: 10 }));
    expect(g.demand).toBe(1200);
    expect(g.total).toBeCloseTo(g.energy + 1200, 6);
  });
});

describe('fees and net savings', () => {
  it('has no fee when none is entered', () => expect(netSavings(mk(), 12000)).toBe(12000));
  it('applies a shared savings percentage', () => {
    const i = mk({ feeMode: 'share', feeSharePct: 25 });
    expect(annualFeePerSite(i, 12000)).toBe(3000);
    expect(netSavings(i, 12000)).toBe(9000);
  });
  it('applies a fixed fee per site', () => {
    const i = mk({ feeMode: 'fixed', feeFixedPerSite: 4000 });
    expect(netSavings(i, 12000)).toBe(8000);
  });
  it('can produce negative net savings when a fixed fee exceeds savings', () => {
    expect(netSavings(mk({ feeMode: 'fixed', feeFixedPerSite: 20000 }), 12000)).toBe(-8000);
  });
});

describe('payback', () => {
  it('is null with no implementation cost', () => expect(paybackMonths(0, 9000)).toBeNull());
  it('is cost divided by monthly net savings', () => expect(paybackMonths(9000, 9000)).toBe(12));
  it('is infinite when net savings are not positive', () => expect(paybackMonths(5000, 0)).toBe(Infinity));
});

describe('multi year value for one site', () => {
  it('sums three and five years with no escalation', () => {
    const i = mk();
    expect(threeYearSite(i)).toBe(36000);
    expect(fiveYearSite(i)).toBe(60000);
  });
  it('compounds escalation from year two', () => {
    const rows = projectSite(mk({ escalationPct: 10 }), 3);
    expect(rows[0].gross).toBe(12000);
    expect(rows[1].gross).toBeCloseTo(13200, 6);
    expect(rows[2].gross).toBeCloseTo(14520, 6);
  });
  it('subtracts one time implementation cost from cumulative value', () => {
    expect(fiveYearSite(mk({ implementationCostPerSite: 10000 }))).toBe(50000);
  });
  it('shares savings with Cosysense when a share is entered', () => {
    expect(fiveYearSite(mk({ feeMode: 'share', feeSharePct: 25 }))).toBe(45000);
  });
});

describe('portfolio scope and rollout', () => {
  it('uses one site in single mode', () => {
    expect(resolveScope(mk({ locations: 250 }), 'single')).toEqual({ locations: 1, rolloutSites: 1, pilotSites: 1, rolloutYears: 1 });
  });
  it('applies the rollout percentage', () => {
    const s = resolveScope(mk({ locations: 250, rolloutPct: 40, pilotSites: 5, rolloutYears: 2 }), 'portfolio');
    expect(s.rolloutSites).toBe(100);
    expect(s.pilotSites).toBe(5);
  });
  it('never lets pilot sites exceed rollout sites', () => {
    const s = resolveScope(mk({ locations: 10, rolloutPct: 20, pilotSites: 8 }), 'portfolio');
    expect(s.rolloutSites).toBe(2);
    expect(s.pilotSites).toBe(2);
  });
  it('ramps live sites across the rollout period', () => {
    const scope = { locations: 100, rolloutSites: 100, pilotSites: 10, rolloutYears: 3 };
    expect(liveSites(scope, 1)).toBeCloseTo(40, 6);
    expect(liveSites(scope, 2)).toBeCloseTo(70, 6);
    expect(liveSites(scope, 3)).toBe(100);
    expect(liveSites(scope, 5)).toBe(100);
  });
  it('matches site value times sites when everything is live from year one', () => {
    const i = mk();
    const scope = { locations: 100, rolloutSites: 100, pilotSites: 100, rolloutYears: 1 };
    expect(fiveYearPortfolio(i, scope)).toBe(100 * 60000);
  });
  it('charges implementation cost only as sites go live', () => {
    const i = mk({ implementationCostPerSite: 1000 });
    const scope = { locations: 100, rolloutSites: 100, pilotSites: 10, rolloutYears: 3 };
    const rows = projectPortfolio(i, scope, 5);
    expect(rows[0].implementation).toBeCloseTo(40 * 1000, 6);
    expect(rows[3].implementation).toBeCloseTo(0, 6);
    const totalImplementation = rows.reduce((s, r) => s + r.implementation, 0);
    expect(totalImplementation).toBeCloseTo(100 * 1000, 6);
  });
  it('values the step from pilot to full rollout', () => {
    const scope = { locations: 250, rolloutSites: 250, pilotSites: 5, rolloutYears: 2 };
    expect(expansionValue(mk(), scope)).toBe(245 * 12000);
  });
  it('reports steady state run rate', () => {
    expect(runRate(mk({ feeMode: 'share', feeSharePct: 25 }), 10).net).toBe(90000);
  });
});

describe('scale ladder', () => {
  it('shows value rising linearly with site count at constant per site economics', () => {
    const ladder = scaleLadder(mk());
    expect(ladder.map((l) => l.sites)).toEqual([1, 10, 100, 500]);
    expect(ladder[0].annualNet).toBe(12000);
    expect(ladder[3].annualNet).toBe(6000000);
    expect(ladder[3].fiveYearNet).toBe(30000000);
  });
});

describe('sensitivity', () => {
  const i = mk();
  const scope = { locations: 100, rolloutSites: 100, pilotSites: 10, rolloutYears: 2 };
  const rows = sensitivity(i, scope);
  it('returns the four drivers', () => expect(rows.map((r) => r.key)).toEqual(['reduction', 'share', 'price', 'sites']));
  it('keeps the base case identical across rows', () => {
    const base = fiveYearPortfolio(i, scope);
    rows.forEach((r) => expect(r.base).toBeCloseTo(base, 6));
  });
  it('orders low below base below high', () => {
    rows.forEach((r) => {
      expect(r.low).toBeLessThanOrEqual(r.base);
      expect(r.high).toBeGreaterThanOrEqual(r.base);
    });
  });
  it('scales price linearly', () => {
    const priceRow = rows.find((r) => r.key === 'price')!;
    expect(priceRow.high / priceRow.base).toBeCloseTo(1.2, 6);
    expect(priceRow.low / priceRow.base).toBeCloseTo(0.8, 6);
  });
  it('withPriceFactor scales every price input', () => {
    const p = withPriceFactor(mk({ monthlyBill: 100, pricePerKwh: 0.1, demandChargePerKw: 10 }), 2);
    expect(p.monthlyBill).toBe(200);
    expect(p.pricePerKwh).toBeCloseTo(0.2, 6);
    expect(p.demandChargePerKw).toBe(20);
  });
});

describe('internal opportunity score', () => {
  it('sums to 100 when every factor is at its full score value', () => {
    const big = mk({ annualSpend: 1_000_000, hvacSharePct: 100, hoursPerDay: 24, daysPerYear: 365 });
    const scope = { locations: 1000, rolloutSites: 1000, pilotSites: 5, rolloutYears: 2 };
    const r = scoreAccount(big, scope);
    expect(r.total).toBeCloseTo(100, 6);
    expect(r.category).toBe('STRATEGIC ACCOUNT');
  });
  it('scores a single small site as low priority', () => {
    const scope = resolveScope(mk({ annualSpend: 20000 }), 'single');
    expect(scoreAccount(mk({ annualSpend: 20000 }), scope).category).toBe('LOW PRIORITY');
  });
  it('normalizes weights that do not sum to 100', () => {
    const scope = { locations: 500, rolloutSites: 500, pilotSites: 5, rolloutYears: 2 };
    const doubled = {
      sites: defaultWeights.sites * 2,
      energySpend: defaultWeights.energySpend * 2,
      hvacSpend: defaultWeights.hvacSpend * 2,
      expansion: defaultWeights.expansion * 2,
      hours: defaultWeights.hours * 2,
      savings: defaultWeights.savings * 2,
    };
    const a = scoreAccount(mk(), scope, defaultWeights).total;
    const b = scoreAccount(mk(), scope, doubled).total;
    expect(b).toBeCloseTo(a, 6);
  });
  it('maps totals to categories using the editable cut offs', () => {
    expect(categorize(10, defaultThresholds)).toBe('LOW PRIORITY');
    expect(categorize(30, defaultThresholds)).toBe('PROMISING');
    expect(categorize(55, defaultThresholds)).toBe('HIGH VALUE');
    expect(categorize(75, defaultThresholds)).toBe('STRATEGIC ACCOUNT');
  });
});
