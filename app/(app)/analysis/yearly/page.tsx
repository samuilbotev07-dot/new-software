import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { safeDiv } from '@/lib/calc/money';
import type { MonthDerived } from '@/lib/calc/types';
import { loadAppContext } from '@/lib/db/queries';
import { MONTH_NAMES, fmtInt, fmtMoney, fmtPct, fmtPctSigned } from '@/lib/format';
import { bg } from '@/lib/i18n/bg';

function yearTotals(months: MonthDerived[]) {
  const sum = (f: (d: MonthDerived) => number) => months.reduce((a, d) => a + f(d), 0);
  const revenue = sum((d) => d.totalRevenue);
  const expenses = sum((d) => d.totalExpenses);
  const toState = sum((d) => d.totalToState);
  const net = sum((d) => d.netProfit);
  const clients = sum((d) => d.clients);
  return { revenue, expenses, toState, net, clients, margin: safeDiv(net, revenue) };
}

export default async function YearlyAnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string }>;
}) {
  const { y } = await searchParams;
  const { derived } = await loadAppContext();

  if (derived.length === 0) {
    return (
      <div className="py-16 text-center text-ink-soft">
        <p>{bg.analysis.noYearData}</p>
        <Link href="/month" className="mt-2 inline-block underline">
          {bg.dashboard.emptyCta}
        </Link>
      </div>
    );
  }

  const years = [...new Set(derived.map((d) => d.year))].sort((a, b) => b - a);
  const year = years.includes(Number(y)) ? Number(y) : years[0]!;
  const months = derived.filter((d) => d.year === year);
  const prevYearMonths = derived.filter((d) => d.year === year - 1);

  const t = yearTotals(months);
  const withRevenue = months.filter((d) => d.totalRevenue > 0);
  const best = withRevenue.length
    ? withRevenue.reduce((a, b) => (b.netProfit > a.netProfit ? b : a))
    : null;
  const worst = withRevenue.length
    ? withRevenue.reduce((a, b) => (b.netProfit < a.netProfit ? b : a))
    : null;

  const pt = prevYearMonths.length > 0 ? yearTotals(prevYearMonths) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-xl font-medium">
          {bg.analysis.yearlyTitle} — {year}
        </h1>
        <div className="flex gap-1">
          {years.map((yr) => (
            <Link
              key={yr}
              href={`/analysis/yearly?y=${yr}`}
              className={`rounded-sm border px-3 py-1 text-sm ${
                yr === year
                  ? 'border-ink bg-ink text-paper'
                  : 'border-rule hover:bg-rule/40'
              }`}
            >
              {yr}
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b-2 border-ink text-left text-xs text-ink-soft">
                <th className="py-2 pr-2 font-medium">{bg.common.month}</th>
                <th className="py-2 text-right font-medium">{bg.dashboard.revenue}</th>
                <th className="py-2 text-right font-medium">{bg.dashboard.expenses}</th>
                <th className="py-2 text-right font-medium">{bg.analysis.toState}</th>
                <th className="py-2 text-right font-medium">{bg.dashboard.netProfit}</th>
                <th className="py-2 text-right font-medium">{bg.dashboard.margin}</th>
                <th className="py-2 pl-2 text-right font-medium">{bg.analysis.clients}</th>
              </tr>
            </thead>
            <tbody>
              {MONTH_NAMES.map((name, i) => {
                const d = months.find((x) => x.month === i + 1);
                return (
                  <tr key={name} className="border-b border-rule">
                    <td className="py-1.5 pr-2">
                      {d ? (
                        <Link href={`/analysis/monthly?y=${year}&m=${i + 1}`} className="underline">
                          {name}
                        </Link>
                      ) : (
                        <span className="text-ink-soft">{name}</span>
                      )}
                    </td>
                    <td className="num py-1.5 text-right">
                      {d ? fmtMoney(d.totalRevenue, 0) : bg.common.dash}
                    </td>
                    <td className="num py-1.5 text-right">
                      {d ? fmtMoney(d.totalExpenses, 0) : bg.common.dash}
                    </td>
                    <td className="num py-1.5 text-right">
                      {d ? fmtMoney(d.totalToState, 0) : bg.common.dash}
                    </td>
                    <td
                      className={`num py-1.5 text-right ${
                        d && d.netProfit < 0 ? 'text-stamp' : ''
                      }`}
                    >
                      {d ? fmtMoney(d.netProfit, 0) : bg.common.dash}
                    </td>
                    <td className="num py-1.5 text-right">
                      {d && d.totalRevenue > 0 ? fmtPct(d.margin) : bg.common.dash}
                    </td>
                    <td className="num py-1.5 pl-2 text-right">
                      {d ? fmtInt(d.clients) : bg.common.dash}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-b border-rule font-semibold">
                <td className="py-2 pr-2">{bg.common.total}</td>
                <td className="num py-2 text-right">{fmtMoney(t.revenue, 0)}</td>
                <td className="num py-2 text-right">{fmtMoney(t.expenses, 0)}</td>
                <td className="num py-2 text-right">{fmtMoney(t.toState, 0)}</td>
                <td className="num py-2 text-right">{fmtMoney(t.net, 0)}</td>
                <td className="num py-2 text-right">
                  {t.revenue > 0 ? fmtPct(t.margin) : bg.common.dash}
                </td>
                <td className="num py-2 pl-2 text-right">{fmtInt(t.clients)}</td>
              </tr>
              <tr className="text-ink-soft">
                <td className="py-2 pr-2">{bg.common.average}</td>
                <td className="num py-2 text-right">
                  {fmtMoney(safeDiv(t.revenue, months.length), 0)}
                </td>
                <td className="num py-2 text-right">
                  {fmtMoney(safeDiv(t.expenses, months.length), 0)}
                </td>
                <td className="num py-2 text-right">
                  {fmtMoney(safeDiv(t.toState, months.length), 0)}
                </td>
                <td className="num py-2 text-right">
                  {fmtMoney(safeDiv(t.net, months.length), 0)}
                </td>
                <td className="py-2" />
                <td className="num py-2 pl-2 text-right">
                  {fmtInt(safeDiv(t.clients, months.length))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card title={bg.analysis.bestMonth}>
          {best ? (
            <p className="text-sm">
              <strong>{MONTH_NAMES[best.month - 1]}</strong> —{' '}
              <span className="num">{fmtMoney(best.netProfit)}</span>{' '}
              {bg.dashboard.netProfit.toLowerCase()}
            </p>
          ) : (
            <p className="text-sm text-ink-soft">{bg.common.noData}</p>
          )}
        </Card>
        <Card title={bg.analysis.worstMonth}>
          {worst ? (
            <p className="text-sm">
              <strong>{MONTH_NAMES[worst.month - 1]}</strong> —{' '}
              <span className="num">{fmtMoney(worst.netProfit)}</span>{' '}
              {bg.dashboard.netProfit.toLowerCase()}
            </p>
          ) : (
            <p className="text-sm text-ink-soft">{bg.common.noData}</p>
          )}
        </Card>
      </div>

      {pt && (
        <Card title={`${bg.analysis.vsPrevYear} (${year - 1})`}>
          <table className="w-full text-sm">
            <tbody>
              {(
                [
                  [bg.dashboard.revenue, t.revenue, pt.revenue],
                  [bg.dashboard.expenses, t.expenses, pt.expenses],
                  [bg.dashboard.netProfit, t.net, pt.net],
                  [bg.analysis.clients, t.clients, pt.clients],
                ] as Array<[string, number, number]>
              ).map(([label, cur, prev]) => (
                <tr key={label} className="border-b border-rule last:border-0">
                  <td className="py-1.5 pr-2">{label}</td>
                  <td className="num py-1.5 text-right">{fmtMoney(cur, 0)}</td>
                  <td className="num py-1.5 text-right text-ink-soft">{fmtMoney(prev, 0)}</td>
                  <td className="num py-1.5 pl-2 text-right">
                    {prev !== 0 ? fmtPctSigned(safeDiv(cur - prev, Math.abs(prev))) : bg.common.dash}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
