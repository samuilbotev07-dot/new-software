import type { Warning } from '@/lib/calc/types';

const styles: Record<Warning['severity'], string> = {
  critical: 'border-stamp bg-stamp-soft text-stamp',
  warning: 'border-amber bg-amber-soft text-ink',
  info: 'border-rule bg-card text-ink-soft',
};

export function WarningsList({ warnings }: { warnings: Warning[] }) {
  if (warnings.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {warnings.map((w, i) => (
        <li
          key={i}
          className={`rounded-sm border-l-4 px-3 py-2 text-sm ${styles[w.severity]}`}
        >
          <p>{w.text}</p>
          {w.action ? <p className="mt-0.5 text-xs opacity-80">→ {w.action}</p> : null}
        </li>
      ))}
    </ul>
  );
}
