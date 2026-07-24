'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useId } from 'react';
import { fmtMonth } from '@/lib/format';
import { bg } from '@/lib/i18n/bg';

/** Избор на месец от вече въведените. Навигира със query ?y=&m=. */
export function MonthPicker({
  options,
  selected,
  paramNames = { year: 'y', month: 'm' },
}: {
  options: Array<{ year: number; month: number }>;
  selected: { year: number; month: number } | null;
  paramNames?: { year: string; month: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const id = useId();

  if (options.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm text-ink-soft">
        {bg.months.pick}
      </label>
      <select
        id={id}
        value={selected ? `${selected.year}-${selected.month}` : ''}
        onChange={(e) => {
          const [y, m] = e.target.value.split('-');
          router.push(`${pathname}?${paramNames.year}=${y}&${paramNames.month}=${m}`);
        }}
        className="min-h-10 rounded-sm border border-rule bg-card px-2 py-1 text-sm"
      >
        {options.map((o) => (
          <option key={`${o.year}-${o.month}`} value={`${o.year}-${o.month}`}>
            {fmtMonth(o.year, o.month)}
          </option>
        ))}
      </select>
    </div>
  );
}
