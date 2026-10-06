import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export type FieldKind = 'input' | 'assumption';

interface FieldShellProps {
  id: string;
  label: string;
  kind: FieldKind;
  hint?: string;
  children: ReactNode;
}

export function FieldShell({ id, label, kind, hint, children }: FieldShellProps) {
  return (
    <div className={`field field--${kind}`}>
      <label htmlFor={id}>
        <span>{label}</span>
        {kind === 'assumption' && <span className="tag">Assumption</span>}
      </label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

interface NumberFieldProps {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
  kind?: FieldKind;
  hint?: string;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
}

export function NumberField({ id, label, value, onChange, kind = 'input', hint, prefix, suffix, min, max }: NumberFieldProps) {
  const [text, setText] = useState(String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);

  return (
    <FieldShell id={id} label={label} kind={kind} hint={hint}>
      <div className="numwrap">
        {prefix && <span className="affix">{prefix}</span>}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={text}
          onFocus={() => {
            focused.current = true;
          }}
          onBlur={() => {
            focused.current = false;
            setText(String(value));
          }}
          onChange={(e) => {
            const t = e.target.value;
            setText(t);
            let n = parseFloat(t.replace(/,/g, ''));
            if (!Number.isFinite(n)) n = 0;
            if (min !== undefined) n = Math.max(min, n);
            if (max !== undefined) n = Math.min(max, n);
            onChange(n);
          }}
        />
        {suffix && <span className="affix">{suffix}</span>}
      </div>
    </FieldShell>
  );
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}

export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
