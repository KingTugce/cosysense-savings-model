import {
  annualElectricitySpend,
  expansionValue,
  feeEntered,
  grossSavings,
  hvacSpend,
  paybackMonths,
  projectPortfolio,
  projectSite,
  resolveScope,
  runRate,
  scaleLadder,
  scenarioComparison,
  selectedReduction,
  sensitivity,
} from '../lib/calc';
import { int, monthsLabel, pct, usd } from '../lib/format';
import type { Mode, ModelInputs } from '../lib/types';
import { ColumnChart, ScenarioBars, Tornado } from './Charts';

interface Props {
  inputs: ModelInputs;
  mode: Mode;
}

const scenarioNames = { conservative: 'Conservative', base: 'Base', high: 'High' } as const;

function Metric({ label, value, note, strong }: { label: string; value: string; note?: string; strong?: boolean }) {
  return (
    <div className={`metric${strong ? ' metric--strong' : ''}`}>
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
      {note && <div className="metric-note">{note}</div>}
    </div>
  );
}

export function Results({ inputs, mode }: Props) {
  const elec = annualElectricitySpend(inputs);
  if (elec <= 0) {
    return (
      <section className="empty">
        <h2>Enter an electricity cost to begin</h2>
        <p>Add a monthly bill, an annual spend, or kWh and price in the panel. Results appear here as soon as there is a number to work with.</p>
      </section>
    );
  }

  const scope = resolveScope(inputs, mode);
  const reduction = selectedReduction(inputs);
  const hv = hvacSpend(inputs);
  const g = grossSavings(inputs);
  const feeOn = feeEntered(inputs);
  const siteRows = projectSite(inputs, 5);
  const site1 = siteRows[0];
  const sitePayback = paybackMonths(inputs.implementationCostPerSite, site1.net);
  const totalEnergyCost = elec + Math.max(inputs.annualGasCost, 0);

  const portRows = projectPortfolio(inputs, scope, 5);
  const run = runRate(inputs, scope.rolloutSites);
  const pilotRun = runRate(inputs, scope.pilotSites);
  const five = portRows[4].cumulativeNet;
  const three = portRows[2].cumulativeNet;
  const expansion = expansionValue(inputs, scope);
  const sens = sensitivity(inputs, scope);
  const scen = scenarioComparison(inputs, scope);
  const ladder = scaleLadder(inputs);
  const isPortfolio = mode === 'portfolio';

  return (
    <div className="results">
      <section className="summary" aria-label="Executive summary">
        <p className="summary-text">
          Based on the assumptions entered, this site currently spends approximately <b>{usd(hv)}</b> per year on HVAC related electricity. At an estimated <b>{pct(reduction)}</b> reduction, the modeled gross savings are <b>{usd(g.total)}</b> annually.
          {isPortfolio ? (
            <> Across <b>{int(scope.rolloutSites)}</b> locations, this represents approximately <b>{usd(run.net)}</b> in annual {feeOn ? 'net ' : ''}savings and <b>{usd(five)}</b> over five years.</>
          ) : (
            <> Over five years, this site would see approximately <b>{usd(siteRows[4].cumulativeNet)}</b> in {feeOn ? 'net ' : ''}savings.</>
          )}
        </p>
        {!feeOn && <p className="summary-note">No Cosysense fee has been entered, so net savings equal gross savings. Enter a fee assumption to see the customer's net position.</p>}
        <p className="summary-note">These are modeled estimates from the assumptions entered, not verified results.</p>
      </section>

      {isPortfolio && (
        <section className="story" aria-label="Pilot to verified value to portfolio rollout">
          <h2>Pilot, verified value, portfolio rollout</h2>
          <div className="stages">
            <div className="stage">
              <div className="stage-name">Pilot</div>
              <div className="stage-big">{int(scope.pilotSites)} {scope.pilotSites === 1 ? 'site' : 'sites'}</div>
              <div className="stage-line">{usd(pilotRun.net)} modeled annual {feeOn ? 'net ' : ''}savings</div>
              <div className="stage-fine">A small, measured start.</div>
            </div>
            <div className="arrow" aria-hidden="true">→</div>
            <div className="stage stage--mid">
              <div className="stage-name">Verified value</div>
              <div className="stage-big">{usd(run.netPerSite)}</div>
              <div className="stage-line">modeled annual {feeOn ? 'net ' : ''}savings per location</div>
              <div className="stage-fine">A target for the pilot to confirm, not a result. Agree the baseline and how savings are measured before go live.</div>
            </div>
            <div className="arrow" aria-hidden="true">→</div>
            <div className="stage stage--end">
              <div className="stage-name">Portfolio rollout</div>
              <div className="stage-big">{int(scope.rolloutSites)} sites</div>
              <div className="stage-line">{usd(run.net)} projected annual {feeOn ? 'net ' : ''}value</div>
              <div className="stage-fine">{usd(five)} over five years, with the rollout ramp.</div>
            </div>
          </div>
          <div className="expand">
            <div>
              <div className="expand-value">{usd(expansion)}</div>
              <div className="expand-label">added annual value from moving {int(scope.pilotSites)} pilot sites to {int(scope.rolloutSites)} sites</div>
            </div>
            <div className="expand-bar" aria-hidden="true">
              <span className="expand-pilot" style={{ width: `${Math.max((scope.pilotSites / scope.rolloutSites) * 100, 1.5)}%` }} />
            </div>
          </div>
        </section>
      )}

      <section className="block" aria-label="One site economics">
        <h2>One site</h2>
        <div className="metrics">
          <Metric label="Annual electricity spend" value={usd(elec)} />
          <Metric label="Estimated annual HVAC spend" value={usd(hv)} note="Energy charges only" />
          <Metric label="Gross annual savings" value={usd(g.total)} strong />
          <Metric label="Cosysense fee" value={feeOn ? usd(site1.fee) : 'Not entered'} />
          <Metric label="Net annual customer savings" value={usd(site1.net)} strong />
          <Metric label="Monthly savings" value={usd(site1.net / 12)} />
          <Metric label="Savings as a share of energy cost" value={pct((site1.net / Math.max(totalEnergyCost, 1)) * 100, 1)} note="Electricity plus gas, if entered" />
          <Metric label="Payback" value={monthsLabel(sitePayback)} />
          <Metric label="3 year savings" value={usd(siteRows[2].cumulativeNet)} />
          <Metric label="5 year savings" value={usd(siteRows[4].cumulativeNet)} />
        </div>
      </section>

      {isPortfolio && (
        <section className="block" aria-label="Portfolio economics">
          <h2>Portfolio</h2>
          <div className="metrics">
            <Metric label="Annual gross savings, full rollout" value={usd(run.gross)} />
            <Metric label="Annual net customer savings" value={usd(run.net)} strong />
            <Metric label="Savings per location" value={usd(run.netPerSite)} />
            <Metric label="3 year portfolio value" value={usd(three)} note="Includes the rollout ramp" />
            <Metric label="5 year portfolio value" value={usd(five)} strong note="Includes the rollout ramp" />
            <Metric label="Value of going from pilot to full rollout" value={usd(expansion)} />
          </div>
          <ColumnChart
            title="Cumulative net customer value by year"
            values={portRows.map((r) => r.cumulativeNet)}
            labels={portRows.map((r) => `Year ${r.year}`)}
          />
          <p className="hint">Cumulative net value by year, for the {scenarioNames[inputs.scenario].toLowerCase()} scenario. Sites beyond the pilot come online across {inputs.rolloutYears} {inputs.rolloutYears === 1 ? 'year' : 'years'}.</p>
        </section>
      )}

      <section className="block" aria-label="Scenario comparison">
        <h2>Conservative, base, and high</h2>
        <p className="sub">Five year net customer value at the three modeled reductions.</p>
        <ScenarioBars rows={scen.map((s) => ({ key: s.key, label: `${scenarioNames[s.key]} (${pct(s.reductionPct)})`, value: s.fiveYearNet }))} />
      </section>

      <section className="block" aria-label="Sensitivity analysis">
        <h2>What moves the answer most</h2>
        <p className="sub">Five year net customer value as each assumption moves, with everything else held where it is. The widest bar matters most.</p>
        <Tornado rows={sens} />
      </section>

      <section className="block" aria-label="Value at different portfolio sizes">
        <h2>One site, ten, a hundred, five hundred</h2>
        <p className="sub">The same per site economics at different portfolio sizes, all sites live from year one.</p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th scope="col">Sites</th><th scope="col">Annual net customer savings</th><th scope="col">5 year net customer value</th></tr>
            </thead>
            <tbody>
              {ladder.map((l) => (
                <tr key={l.sites}><th scope="row">{int(l.sites)}</th><td>{usd(l.annualNet)}</td><td>{usd(l.fiveYearNet)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
