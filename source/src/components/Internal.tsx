import { feeEntered, projectPortfolio, resolveScope, runRate, sensitivity } from '../lib/calc';
import { int, pct, usd } from '../lib/format';
import {
  defaultFullAt,
  defaultThresholds,
  defaultWeights,
  factorLabels,
  factorUnits,
  scoreAccount,
} from '../lib/score';
import type { Mode, ModelInputs, ScoreFullAt, ScoreThresholds, ScoreWeights } from '../lib/types';
import { NumberField } from './Fields';

interface Props {
  inputs: ModelInputs;
  mode: Mode;
  weights: ScoreWeights;
  setWeights: (w: ScoreWeights) => void;
  fullAt: ScoreFullAt;
  setFullAt: (f: ScoreFullAt) => void;
  thresholds: ScoreThresholds;
  setThresholds: (t: ScoreThresholds) => void;
}

const categoryClass: Record<string, string> = {
  'LOW PRIORITY': 'cat cat--low',
  PROMISING: 'cat cat--promising',
  'HIGH VALUE': 'cat cat--high',
  'STRATEGIC ACCOUNT': 'cat cat--strategic',
};

export function Internal({ inputs, mode, weights, setWeights, fullAt, setFullAt, thresholds, setThresholds }: Props) {
  const scope = resolveScope(inputs, mode);
  const score = scoreAccount(inputs, scope, weights, fullAt, thresholds);
  const feeOn = feeEntered(inputs);
  const rows = projectPortfolio(inputs, scope, 5);
  const run = runRate(inputs, scope.rolloutSites);
  const fiveYearFees = rows.reduce((s, r) => s + r.fee, 0);
  const sens = sensitivity(inputs, scope);
  const widest = [...sens].sort((a, b) => b.high - b.low - (a.high - a.low))[0];
  const keys = Object.keys(weights) as (keyof ScoreWeights)[];
  const weightSum = keys.reduce((s, k) => s + weights[k], 0);

  const reset = () => {
    setWeights(defaultWeights);
    setFullAt(defaultFullAt);
    setThresholds(defaultThresholds);
  };

  return (
    <div className="internal">
      <div className="internal-banner">
        Internal prioritization model. Not a customer facing metric. The weights, full score values, and cut offs below are placeholders for discussion. They have not been validated against real accounts.
      </div>

      <section className="block">
        <h2>Account score</h2>
        <div className="scorehead">
          <div className="scorebig">{Math.round(score.total)}<span> / 100</span></div>
          <div className={categoryClass[score.category]}>{score.category}</div>
        </div>
        <div className="scorebar" aria-hidden="true">
          <span className="scorefill" style={{ width: `${score.total}%` }} />
          {[thresholds.promising, thresholds.highValue, thresholds.strategic].map((t) => (
            <i key={t} className="scoremark" style={{ left: `${t}%` }} />
          ))}
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Factor</th>
                <th scope="col">Value for this account</th>
                <th scope="col">Full score at</th>
                <th scope="col">Weight</th>
                <th scope="col">Points</th>
              </tr>
            </thead>
            <tbody>
              {score.components.map((c) => (
                <tr key={c.key}>
                  <th scope="row">{factorLabels[c.key]}<div className="unit">{factorUnits[c.key]}</div></th>
                  <td>{c.key === 'energySpend' || c.key === 'hvacSpend' || c.key === 'savings' ? usd(c.raw) : int(c.raw)}</td>
                  <td>{c.key === 'energySpend' || c.key === 'hvacSpend' || c.key === 'savings' ? usd(c.fullAt) : int(c.fullAt)}</td>
                  <td>{pct(c.weight, 0)}</td>
                  <td>{c.points.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="hint">Each factor scores in a straight line from zero up to its full score value, then is multiplied by its weight. Weights are rescaled to total 100, so only their proportions matter.</p>

        <h3>Edit the scoring logic</h3>
        <div className="editgrid">
          {keys.map((k) => (
            <div className="editrow" key={k}>
              <div className="editname">{factorLabels[k]}</div>
              <NumberField id={`w-${k}`} label="Weight" value={weights[k]} onChange={(n) => setWeights({ ...weights, [k]: n })} min={0} kind="assumption" />
              <NumberField id={`f-${k}`} label="Full score at" value={fullAt[k]} onChange={(n) => setFullAt({ ...fullAt, [k]: n })} min={1} kind="assumption" />
            </div>
          ))}
        </div>
        <p className="hint">Weights currently total {weightSum}.</p>
        <div className="three">
          <NumberField id="t-p" label="Promising from" value={thresholds.promising} onChange={(n) => setThresholds({ ...thresholds, promising: n })} min={0} max={100} kind="assumption" />
          <NumberField id="t-h" label="High value from" value={thresholds.highValue} onChange={(n) => setThresholds({ ...thresholds, highValue: n })} min={0} max={100} kind="assumption" />
          <NumberField id="t-s" label="Strategic from" value={thresholds.strategic} onChange={(n) => setThresholds({ ...thresholds, strategic: n })} min={0} max={100} kind="assumption" />
        </div>
        <button type="button" className="textbtn" onClick={reset}>Reset scoring to the starting placeholders</button>
      </section>

      <section className="block">
        <h2>Is this account attractive to Cosysense</h2>
        {feeOn ? (
          <div className="metrics">
            <div className="metric metric--strong"><div className="metric-value">{usd(run.fee)}</div><div className="metric-label">Annual fee revenue at full rollout</div></div>
            <div className="metric"><div className="metric-value">{usd(fiveYearFees)}</div><div className="metric-label">Fee revenue over five years, with the ramp</div></div>
            <div className="metric"><div className="metric-value">{usd(run.fee / Math.max(scope.rolloutSites, 1))}</div><div className="metric-label">Fee revenue per site per year</div></div>
            <div className="metric"><div className="metric-value">{usd(run.netPerSite)}</div><div className="metric-label">Net value left with the customer per site</div></div>
          </div>
        ) : (
          <p className="sub">No fee assumption has been entered, so fee revenue cannot be shown. Choose a fee structure in the assumptions panel to see revenue per site and per account. This model also has no cost to serve, so it shows revenue, not profit.</p>
        )}
        <p className="sub">
          The assumption that moves the five year customer value most is <b>{widest.label.toLowerCase()}</b>, from {usd(widest.low)} to {usd(widest.high)} across the range tested. Confirm that assumption first when qualifying an account.
        </p>
      </section>
    </div>
  );
}
