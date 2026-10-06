export function usd(n: number, compact = true): string {
  if (!Number.isFinite(n)) return 'not reached';
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  if (compact && a >= 1e9) return `${sign}$${(a / 1e9).toFixed(2)}B`;
  if (compact && a >= 1e6) return `${sign}$${(a / 1e6).toFixed(2)}M`;
  return `${sign}$${Math.round(a).toLocaleString('en-US')}`;
}

export function pct(n: number, digits = 0): string {
  return `${n.toFixed(digits)}%`;
}

export function monthsLabel(m: number | null): string {
  if (m === null) return 'No implementation cost entered';
  if (!Number.isFinite(m)) return 'Not reached at these inputs';
  if (m < 1) return 'Under 1 month';
  if (m < 24) return `${m.toFixed(1)} months`;
  return `${(m / 12).toFixed(1)} years`;
}

export function int(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}
