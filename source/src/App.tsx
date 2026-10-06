import { useState } from 'react';
import { Assumptions } from './components/Assumptions';
import { Inputs } from './components/Inputs';
import { Internal } from './components/Internal';
import { Results } from './components/Results';
import { Segmented } from './components/Fields';
import { baseInputs, presets } from './lib/presets';
import { defaultFullAt, defaultThresholds, defaultWeights } from './lib/score';
import type { Audience, Mode, ModelInputs, ScoreFullAt, ScoreThresholds, ScoreWeights } from './lib/types';

export default function App() {
  const [inputs, setInputs] = useState<ModelInputs>(baseInputs);
  const [mode, setMode] = useState<Mode>('portfolio');
  const [audience, setAudience] = useState<Audience>('customer');
  const [presetId, setPresetId] = useState<string>('qsr');
  const [weights, setWeights] = useState<ScoreWeights>(defaultWeights);
  const [fullAt, setFullAt] = useState<ScoreFullAt>(defaultFullAt);
  const [thresholds, setThresholds] = useState<ScoreThresholds>(defaultThresholds);

  const set = <K extends keyof ModelInputs>(key: K, value: ModelInputs[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  const choosePreset = (id: string) => {
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    setPresetId(id);
    setInputs((prev) => ({ ...prev, ...p.values }));
  };

  return (
    <div className="page">
      <header className="top">
        <div>
          <h1>From pilot to portfolio</h1>
          <p className="lede">
            A savings model for building automation, for one site or an entire portfolio. Every number is editable, and every assumption is labeled.
          </p>
          <p className="independent">Independent prototype prepared by Tugce Simsek King. Not an official Cosysense tool, and not affiliated with or endorsed by Cosysense.</p>
        </div>
      </header>

      <div className="controls">
        <div className="control">
          <span className="control-label">Scope</span>
          <Segmented<Mode>
            label="Scope"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'single', label: 'Single site' },
              { value: 'portfolio', label: 'Portfolio' },
            ]}
          />
        </div>
        <div className="control">
          <span className="control-label">View</span>
          <Segmented<Audience>
            label="View"
            value={audience}
            onChange={setAudience}
            options={[
              { value: 'customer', label: 'Customer view' },
              { value: 'internal', label: 'Internal view' },
            ]}
          />
        </div>
        <div className="control">
          <label className="control-label" htmlFor="preset">Illustrative example</label>
          <select id="preset" value={presetId} onChange={(e) => choosePreset(e.target.value)}>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <main className="layout">
        <aside className="side" aria-label="Inputs and assumptions">
          <Inputs inputs={inputs} mode={mode} set={set} />
        </aside>
        <div className="main">
          <Results inputs={inputs} mode={mode} />
          {audience === 'internal' && (
            <Internal
              inputs={inputs}
              mode={mode}
              weights={weights}
              setWeights={setWeights}
              fullAt={fullAt}
              setFullAt={setFullAt}
              thresholds={thresholds}
              setThresholds={setThresholds}
            />
          )}
          <Assumptions />
        </div>
      </main>

      <footer className="foot">
        <p>
          This calculator provides modeled estimates based on user-provided assumptions and is intended for preliminary financial analysis. Actual savings depend on building conditions, equipment, operating patterns, energy tariffs, weather, occupancy, and deployment configuration.
        </p>
        <p>No savings are guaranteed. Cosysense has publicly reported HVAC savings in the 27% to 38% range. That range is company reported and not independently verified here.</p>
      </footer>
    </div>
  );
}
