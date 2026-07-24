import Link from 'next/link';
import { HealthTrendChart } from '@/components/health/health-trend-chart';
import { MonthPicker } from '@/components/month-picker';
import { Card } from '@/components/ui/card';
import { computeHealth } from '@/lib/calc/health';
import { findMonth, historyBefore, loadAppContext } from '@/lib/db/queries';
import { fmtMonth, fmtMonthShort, fmtPct } from '@/lib/format';
import { bg } from '@/lib/i18n/bg';

const statusTone: Record<string, string> = {
  stable: 'text-ledger',
  good: 'text-ink',
  needs_work: 'text-amber',
  high_risk: 'text-stamp',
};

export default async function HealthPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const { y, m } = await searchParams;
  const { derived, settings } = await loadAppContext();

  if (derived.length === 0) {
    return (
      <div className="py-16 text-center text-ink-soft">
        <p>{bg.healthPage.noData}</p>
        <Link href="/month" className="mt-2 inline-block underline">
          {bg.dashboard.emptyCta}
        </Link>
      </div>
    );
  }

  const last = derived[derived.length - 1]!;
  const current = findMonth(derived, Number(y) || last.year, Number(m) || last.month) ?? last;
  const health = computeHealth(
    current,
    historyBefore(derived, current.year, current.month),
    settings,
  );

  const trend = derived.slice(-12).map((d) => ({
    label: fmtMonthShort(d.year, d.month),
    score: computeHealth(d, historyBefore(derived, d.year, d.month), settings).total,
  }));

  const weak = health.categories.filter((c) => c.score != null && c.score < 60);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-xl font-medium">
          {bg.healthPage.title} — {fmtMonth(current.year, current.month)}
        </h1>
        <MonthPicker
          options={derived.map((d) => ({ year: d.year, month: d.month })).reverse()}
          selected={{ year: current.year, month: current.month }}
        />
      </div>

      <Card>
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <span className="num font-display text-6xl font-bold">{health.total}</span>
          <span className={`text-lg font-medium ${statusTone[health.status]}`}>
            {bg.health.status[health.status]}
          </span>
        </div>
      </Card>

      <Card>
        <ul className="flex flex-col">
          {health.categories.map((c) => (
            <li
              key={c.key}
              className="flex flex-col gap-1 border-b border-rule py-3 last:border-0"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium">{c.label}</span>
                <span className="num text-sm">
                  {c.score != null ? (
                    <>
                      <strong>{c.score}</strong>
                      <span className="text-ink-soft">
                        {' '}
                        · {bg.healthPage.weight} {fmtPct(c.weight, 0)} ·{' '}
                        {bg.healthPage.contribution} {c.contribution.toFixed(1)}
                      </span>
                    </>
                  ) : (
                    <span className="text-ink-soft">{bg.health.needMoreData}</span>
                  )}
                </span>
              </div>
              {c.score != null ? (
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-rule"
                  role="img"
                  aria-label={`${c.label}: ${c.score}/100`}
                >
                  <div
                    className={`h-full ${
                      c.score >= 80 ? 'bg-ledger' : c.score >= 40 ? 'bg-amber' : 'bg-stamp'
                    }`}
                    style={{ width: `${c.score}%` }}
                  />
                </div>
              ) : null}
              <p className="text-sm text-ink-soft">{c.reason}</p>
            </li>
          ))}
        </ul>
      </Card>

      {weak.length > 0 && (
        <Card title={bg.healthPage.recommendations}>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm">
            {weak.map((c) => (
              <li key={c.key}>
                <strong>{c.label}:</strong> {bg.healthPage.advice[c.key] ?? ''}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {trend.length >= 2 && (
        <Card title={bg.healthPage.trendTitle}>
          <HealthTrendChart data={trend} />
        </Card>
      )}
    </div>
  );
}
