import { usd } from '../lib/format';
import type { SensitivityRow } from '../lib/types';

interface ColumnChartProps {
  title: string;
  values: number[];
  labels: string[];
}

/** Columns for cumulative net value by year. */
export function ColumnChart({ title, values, labels }: ColumnChartProps) {
  const max = Math.max(...values.map((v) => Math.abs(v)), 1);
  const w = 520;
  const h = 200;
  const pad = 28;
  const bw = (w - pad * 2) / values.length;
  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${w} ${h + 34}`} role="img" aria-label={title}>
        <line x1={pad} x2={w - pad} y1={h} y2={h} stroke="var(--rule)" />
        {values.map((v, i) => {
          const bh = (Math.abs(v) / max) * (h - 36);
          const x = pad + i * bw + bw * 0.18;
          const y = v >= 0 ? h - bh : h;
          return (
            <g key={i}>
              <rect x={x} y={y} width={bw * 0.64} height={Math.max(bh, 1)} rx="3" fill="var(--keeps)" opacity={0.35 + 0.13 * i} />
              <text x={x + bw * 0.32} y={y - 6} textAnchor="middle" className="chart-val">{usd(v)}</text>
              <text x={x + bw * 0.32} y={h + 20} textAnchor="middle" className="chart-lab">{labels[i]}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

interface ScenarioBarsProps {
  rows: { key: string; label: string; value: number }[];
}

export function ScenarioBars({ rows }: ScenarioBarsProps) {
  const max = Math.max(...rows.map((r) => Math.abs(r.value)), 1);
  return (
    <div className="hbars">
      {rows.map((r) => (
        <div className="hbar" key={r.key}>
          <span className="hbar-label">{r.label}</span>
          <span className="hbar-track">
            <span className="hbar-fill" style={{ width: `${(Math.max(r.value, 0) / max) * 100}%` }} />
          </span>
          <span className="hbar-value">{usd(r.value)}</span>
        </div>
      ))}
    </div>
  );
}

interface TornadoProps {
  rows: SensitivityRow[];
}

/** One at a time sensitivity: how far each driver moves the five year value up or down. */
export function Tornado({ rows }: TornadoProps) {
  const sorted = [...rows].sort((a, b) => b.high - b.low - (a.high - a.low));
  const maxSide = Math.max(...sorted.map((r) => Math.max(r.base - r.low, r.high - r.base)), 1);
  return (
    <div className="tornado" role="list">
      {sorted.map((r) => {
        const leftW = ((r.base - r.low) / maxSide) * 50;
        const rightW = ((r.high - r.base) / maxSide) * 50;
        return (
          <div className="trow" role="listitem" key={r.key}>
            <div className="tname">{r.label}</div>
            <div className="ttrack">
              <span className="tleft" style={{ width: `${leftW}%` }} />
              <span className="tright" style={{ width: `${rightW}%` }} />
              <span className="tcenter" />
            </div>
            <div className="tvals">
              <span>{r.lowLabel}: {usd(r.low)}</span>
              <span>{r.highLabel}: {usd(r.high)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
