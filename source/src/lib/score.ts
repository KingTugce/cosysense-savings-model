import { annualElectricitySpend, hvacSpend, runRate } from './calc';
import type {
  ModelInputs,
  Scope,
  ScoreCategory,
  ScoreComponent,
  ScoreFullAt,
  ScoreResult,
  ScoreThresholds,
  ScoreWeights,
} from './types';

/**
 * Internal prioritization model. Not a customer facing metric.
 * Each factor is scored linearly from 0 to 1, reaching 1 at its "full score at" value,
 * then multiplied by its weight. Weights, full score values, and category cut offs are all
 * placeholders chosen for discussion. They have not been validated against real outcomes.
 */

export const defaultWeights: ScoreWeights = {
  sites: 20,
  energySpend: 15,
  hvacSpend: 15,
  expansion: 15,
  hours: 10,
  savings: 25,
};

export const defaultFullAt: ScoreFullAt = {
  sites: 500,
  energySpend: 5_000_000,
  hvacSpend: 1_500_000,
  expansion: 50,
  hours: 6000,
  savings: 1_000_000,
};

export const defaultThresholds: ScoreThresholds = {
  promising: 30,
  highValue: 55,
  strategic: 75,
};

export const factorLabels: Record<keyof ScoreWeights, string> = {
  sites: 'Number of sites in the account',
  energySpend: 'Annual electricity spend, all sites',
  hvacSpend: 'Estimated annual HVAC spend, rollout sites',
  expansion: 'Expansion potential (rollout sites per pilot site)',
  hours: 'Operating hours per year',
  savings: 'Expected annual net savings at full rollout',
};

export const factorUnits: Record<keyof ScoreWeights, string> = {
  sites: 'sites',
  energySpend: 'USD per year',
  hvacSpend: 'USD per year',
  expansion: 'times',
  hours: 'hours per year',
  savings: 'USD per year',
};

export function categorize(total: number, t: ScoreThresholds): ScoreCategory {
  if (total >= t.strategic) return 'STRATEGIC ACCOUNT';
  if (total >= t.highValue) return 'HIGH VALUE';
  if (total >= t.promising) return 'PROMISING';
  return 'LOW PRIORITY';
}

export function scoreAccount(
  i: ModelInputs,
  scope: Scope,
  weights: ScoreWeights = defaultWeights,
  fullAt: ScoreFullAt = defaultFullAt,
  thresholds: ScoreThresholds = defaultThresholds,
): ScoreResult {
  const weightSum = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const raw: Record<keyof ScoreWeights, number> = {
    sites: scope.locations,
    energySpend: annualElectricitySpend(i) * scope.locations,
    hvacSpend: hvacSpend(i) * scope.rolloutSites,
    expansion: scope.rolloutSites / Math.max(scope.pilotSites, 1),
    hours: Math.max(i.hoursPerDay, 0) * Math.max(i.daysPerYear, 0),
    savings: runRate(i, scope.rolloutSites).net,
  };
  const keys = Object.keys(weights) as (keyof ScoreWeights)[];
  const components: ScoreComponent[] = keys.map((k) => {
    const full = fullAt[k] > 0 ? fullAt[k] : 1;
    const normalized = Math.min(Math.max(raw[k] / full, 0), 1);
    const weight = (weights[k] / weightSum) * 100;
    return { key: k, label: factorLabels[k], raw: raw[k], fullAt: full, normalized, weight, points: normalized * weight };
  });
  const total = components.reduce((s, c) => s + c.points, 0);
  return { components, total, category: categorize(total, thresholds) };
}
