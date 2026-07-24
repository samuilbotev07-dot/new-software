'use client';

import { useEffect, useId, useState } from 'react';
import { parseDecimal, toInputValue } from '@/lib/parse';

const inputClass =
  'w-full min-h-11 rounded-sm border border-rule bg-card px-3 py-2 text-base text-ink placeholder:text-ink-soft/60 focus:border-ink';

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className={inputClass}
      />
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={`${inputClass} min-h-20 resize-y`}
      />
    </div>
  );
}

/**
 * Поле за число/сума. Приема и запетая, и точка за десетични.
 * Пази локален текст при писане и връща число нагоре.
 */
export function NumberField({
  label,
  value,
  onChange,
  suffix,
  hint,
  integer = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  hint?: string;
  integer?: boolean;
}) {
  const id = useId();
  const [text, setText] = useState(() => toInputValue(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(toInputValue(value));
  }, [value, focused]);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode={integer ? 'numeric' : 'decimal'}
          value={text}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setText(toInputValue(value));
          }}
          onChange={(e) => {
            setText(e.target.value);
            const n = parseDecimal(e.target.value);
            onChange(integer ? Math.trunc(n) : n);
          }}
          placeholder="0"
          className={`${inputClass} num ${suffix ? 'pr-10' : ''}`}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-ink-soft">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? <p className="text-xs text-ink-soft">{hint}</p> : null}
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
