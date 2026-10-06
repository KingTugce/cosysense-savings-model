import { facilityTypes } from '../lib/presets';
import type { FeeMode, Mode, ModelInputs, ScenarioKey, SpendMode } from '../lib/types';
import { FieldShell, NumberField, Segmented } from './Fields';

interface Props {
  inputs: ModelInputs;
  mode: Mode;
  set: <K extends keyof ModelInputs>(key: K, value: ModelInputs[K]) => void;
}

const scenarioOptions: { value: ScenarioKey; label: string }[] = [
  { value: 'conservative', label: 'Conservative' },
  { value: 'base', label: 'Base' },
  { value: 'high', label: 'High' },
];

export function Inputs({ inputs, mode, set }: Props) {
  const setScenarioValue = (k: ScenarioKey, v: number) => set('scenarios', { ...inputs.scenarios, [k]: v });

  return (
    <div className="inputs">
      <div className="legend-row" aria-hidden="true">
        <span><i className="swatch swatch--input" /> Your facts</span>
        <span><i className="swatch swatch--assumption" /> Modeling assumptions</span>
      </div>

      <section className="group">
        <h3>Facility</h3>
        <FieldShell id="ftype" label="Facility type" kind="input">
          <select id="ftype" value={inputs.facilityType} onChange={(e) => set('facilityType', e.target.value)}>
            {facilityTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </FieldShell>
        <NumberField id="sqft" label="Square feet per site" value={inputs.squareFeet} onChange={(n) => set('squareFeet', n)} min={0} />
        <div className="two">
          <NumberField id="hours" label="Operating hours per day" value={inputs.hoursPerDay} onChange={(n) => set('hoursPerDay', n)} min={0} max={24} />
          <NumberField id="days" label="Days per year" value={inputs.daysPerYear} onChange={(n) => set('daysPerYear', n)} min={0} max={366} />
        </div>
      </section>

      <section className="group">
        <h3>Energy</h3>
        <FieldShell id="spendMode" label="How do you know the electricity cost?" kind="input">
          <Segmented<SpendMode>
            label="Electricity cost entry method"
            value={inputs.spendMode}
            onChange={(v) => set('spendMode', v)}
            options={[
              { value: 'monthly', label: 'Monthly bill' },
              { value: 'annual', label: 'Annual spend' },
              { value: 'kwh', label: 'kWh and price' },
            ]}
          />
        </FieldShell>
        {inputs.spendMode === 'monthly' && (
          <NumberField id="bill" label="Monthly electricity bill, per site" value={inputs.monthlyBill} onChange={(n) => set('monthlyBill', n)} prefix="$" min={0} hint="Use an average month, or the annual total divided by twelve." />
        )}
        {inputs.spendMode === 'annual' && (
          <NumberField id="annual" label="Annual electricity spend, per site" value={inputs.annualSpend} onChange={(n) => set('annualSpend', n)} prefix="$" min={0} />
        )}
        {inputs.spendMode === 'kwh' && (
          <div className="two">
            <NumberField id="kwh" label="Annual kWh, per site" value={inputs.annualKwh} onChange={(n) => set('annualKwh', n)} min={0} />
            <NumberField id="price" label="Price per kWh" value={inputs.pricePerKwh} onChange={(n) => set('pricePerKwh', n)} prefix="$" min={0} hint="Use the customer's own tariff." />
          </div>
        )}
        <NumberField
          id="hvacshare"
          label="Share of electricity used by HVAC"
          value={inputs.hvacSharePct}
          onChange={(n) => set('hvacSharePct', n)}
          suffix="%"
          min={0}
          max={100}
          kind="assumption"
          hint="Varies by building. Use sub metering or an audit if available."
        />
      </section>

      <section className="group">
        <h3>Savings assumptions</h3>
        <FieldShell id="scn" label="Scenario in use" kind="assumption">
          <Segmented<ScenarioKey>
            label="Savings scenario"
            value={inputs.scenario}
            onChange={(v) => set('scenario', v)}
            options={scenarioOptions}
          />
        </FieldShell>
        <div className="three">
          {scenarioOptions.map((o) => (
            <NumberField
              key={o.value}
              id={`scn-${o.value}`}
              label={o.label}
              value={inputs.scenarios[o.value]}
              onChange={(n) => setScenarioValue(o.value, n)}
              suffix="%"
              min={0}
              max={100}
              kind="assumption"
            />
          ))}
        </div>
        <p className="refnote">
          Cosysense has publicly reported HVAC savings in the 27% to 38% range across its customers. This is a company reported reference, not independently verified, and not a guarantee. The scenario values above are modeling assumptions, not predictions.
        </p>
      </section>

      <section className="group">
        <h3>Cosysense fee and cost</h3>
        <FieldShell id="feemode" label="Fee structure" kind="assumption" hint="No fee has been published. Leave blank to see gross savings only.">
          <Segmented<FeeMode>
            label="Fee structure"
            value={inputs.feeMode}
            onChange={(v) => set('feeMode', v)}
            options={[
              { value: 'none', label: 'Not entered' },
              { value: 'share', label: 'Share of savings' },
              { value: 'fixed', label: 'Fixed per site' },
            ]}
          />
        </FieldShell>
        {inputs.feeMode === 'share' && (
          <NumberField id="feeshare" label="Share of gross savings paid to Cosysense" value={inputs.feeSharePct} onChange={(n) => set('feeSharePct', n)} suffix="%" min={0} max={100} kind="assumption" />
        )}
        {inputs.feeMode === 'fixed' && (
          <NumberField id="feefixed" label="Annual fee per site" value={inputs.feeFixedPerSite} onChange={(n) => set('feeFixedPerSite', n)} prefix="$" min={0} kind="assumption" />
        )}
        <NumberField
          id="impl"
          label="One time implementation cost per site"
          value={inputs.implementationCostPerSite}
          onChange={(n) => set('implementationCostPerSite', n)}
          prefix="$"
          min={0}
          kind="assumption"
          hint="Defaults to $0. This is an editable assumption, not a confirmed contract term."
        />
      </section>

      {mode === 'portfolio' && (
        <section className="group">
          <h3>Portfolio</h3>
          <NumberField id="locs" label="Number of locations" value={inputs.locations} onChange={(n) => set('locations', n)} min={1} />
          <div className="two">
            <NumberField id="rollpct" label="Share expected to roll out" value={inputs.rolloutPct} onChange={(n) => set('rolloutPct', n)} suffix="%" min={0} max={100} kind="assumption" />
            <NumberField id="pilot" label="Pilot sites" value={inputs.pilotSites} onChange={(n) => set('pilotSites', n)} min={1} />
          </div>
          <NumberField id="rollyears" label="Rollout period" value={inputs.rolloutYears} onChange={(n) => set('rolloutYears', n)} suffix="years" min={1} max={5} kind="assumption" hint="Sites beyond the pilot are added in equal steps across this period." />
        </section>
      )}

      <details className="group advanced">
        <summary>Advanced: tariff, demand, and gas</summary>
        <p className="hint">Leave blank if unknown. No utility rates are built in. Enter the customer's own tariff.</p>
        <NumberField id="peakkw" label="Current peak demand" value={inputs.peakDemandKw} onChange={(n) => set('peakDemandKw', n)} suffix="kW" min={0} />
        <NumberField id="demandrate" label="Demand charge" value={inputs.demandChargePerKw} onChange={(n) => set('demandChargePerKw', n)} prefix="$" suffix="per kW per month" min={0} />
        <NumberField id="demandred" label="Peak demand reduction" value={inputs.demandReductionPct} onChange={(n) => set('demandReductionPct', n)} suffix="%" min={0} max={100} kind="assumption" hint="Defaults to 0%. Demand charges are kept apart from HVAC energy savings to avoid double counting." />
        <NumberField id="gas" label="Annual gas or heating cost, per site" value={inputs.annualGasCost} onChange={(n) => set('annualGasCost', n)} prefix="$" min={0} />
        <NumberField id="gasred" label="Gas or heating reduction" value={inputs.gasReductionPct} onChange={(n) => set('gasReductionPct', n)} suffix="%" min={0} max={100} kind="assumption" hint="Defaults to 0%. No public figure exists for gas savings." />
        <NumberField id="tou" label="Time of use value factor" value={inputs.touFactor} onChange={(n) => set('touFactor', n)} min={0} kind="assumption" hint="1.00 is neutral. Raise it if savings fall in expensive peak hours." />
        <NumberField id="esc" label="Annual electricity cost escalation" value={inputs.escalationPct} onChange={(n) => set('escalationPct', n)} suffix="%" min={0} max={30} kind="assumption" hint="Defaults to 0%. No price forecast is assumed." />
      </details>
    </div>
  );
}
