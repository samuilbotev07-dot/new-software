import Link from 'next/link';
import { MonthPicker } from '@/components/month-picker';
import { Card } from '@/components/ui/card';
import { safeDiv } from '@/lib/calc/money';
import type { MonthDerived } from '@/lib/calc/types';
import { findMonth, loadAppContext, prevOf, yoyOf } from '@/lib/db/queries';
import {
  fmtInt,
  fmtMoney,
  fmtMonth,
  fmtPct,
  fmtPctSigned,
} from '@/lib/format';
import { bg } from '@/lib/i18n/bg';

type Metric = {
  label: string;
  value: (d: MonthDerived) => number;
  format: (v: number, d: MonthDerived) => string;
  /** По-високо = по-добре (за посоката на стрелката). */
  higherIsBetter: boolean;
};

/** 13-те показателя за сравнение. */
const METRICS: Metric[] = [
  { label: bg.dashboard.revenue, value: (d) => d.totalRevenue, format: (v) => fmtMoney(v), higherIsBetter: true },
  { label: bg.dashboard.expenses, value: (d) => d.totalExpenses, format: (v) => fmtMoney(v), higherIsBetter: false },
  { label: bg.analysis.grossProfit, value: (d) => d.grossProfit, format: (v) => fmtMoney(v), higherIsBetter: true },
  { label: bg.analysis.toState, value: (d) => d.totalToState, format: (v) => fmtMoney(v), higherIsBetter: false },
  { label: bg.dashboard.netProfit, value: (d) => d.netProfit, format: (v) => fmtMoney(v), higherIsBetter: true },
  {
    label: bg.dashboard.margin,
    value: (d) => d.margin,
    format: (v, d) => (d.totalRevenue > 0 ? fmtPct(v) : bg.common.dash),
    higherIsBetter: true,
  },
  { label: bg.analysis.clients, value: (d) => d.clients, format: (v) => fmtInt(v), higherIsBetter: true },
  {
    label: bg.analysis.avgTicket,
    value: (d) => d.avgTicket,
    format: (v, d) => (d.clients > 0 ? fmtMoney(v) : bg.common.dash),
    higherIsBetter: true,
  },
  { label: bg.monthEntry.basics.transactions, value: (d) => d.transactions, format: (v) => fmtInt(v), higherIsBetter: true },
  {
    label: bg.analysis.revenuePerDay,
    value: (d) => d.revenuePerWorkingDay,
    format: (v, d) => (d.workingDays > 0 ? fmtMoney(v) : bg.common.dash),
    higherIsBetter: true,
  },
  { label: bg.dashboard.cash, value: (d) => d.cashEnd, format: (v) => fmtMoney(v), higherIsBetter: true },
  {
    label: `${bg.dashboard.cash} — промяна`,
    value: (d) => d.cashChange,
    format: (v) => fmtMoney(v),
    higherIsBetter: true,
  },
  {
    label: `${bg.dashboard.expenses} / ${bg.dashboard.revenue}`,
    value: (d) => d.expenseRatio,
    format: (v, d) => (d.totalRevenue > 0 ? fmtPct(v) : bg.common.dash),
    higherIsBetter: false,
  },
];

function CompareTable({ a, b }: { a: MonthDerived; b: MonthDerived }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b-2 border-ink text-left text-xs text-ink-soft">
            <th className="py-2 pr-2 font-medium">{bg.analysis.metric}</th>
            <th className="py-2 text-right font-medium">{fmtMonth(a.year, a.month)}</th>
            <th className="py-2 text-right font-medium">{fmtMonth(b.year, b.month)}</th>
            <th className="py-2 text-right font-medium">{bg.compare.diff}</th>
            <th className="py-2 pl-2 text-right font-medium">{bg.compare.diffPct}</th>
          </tr>
        </thead>
        <tbody>
          {METRICS.map((metric) => {
            const va = metric.value(a);
            const vb = metric.value(b);
            const diff = vb - va;
            const pct = va !== 0 ? safeDiv(diff, Math.abs(va)) : null;
            const improved = diff === 0 ? null : metric.higherIsBetter ? diff > 0 : diff < 0;
            const arrow = diff === 0 ? '→' : diff > 0 ? '↑' : '↓';
            return (
              <tr key={metric.label} className="border-b border-rule last:border-0">
                <td className="py-1.5 pr-2">{metric.label}</td>
                <td className="num py-1.5 text-right">{metric.format(va, a)}</td>
                <td className="num py-1.5 text-right">{metric.format(vb, b)}</td>
                <td
                  className={`num py-1.5 text-right ${
                    improved == null ? 'text-ink-soft' : improved ? 'text-ledger' : 'text-stamp'
                  }`}
                >
                  {arrow} {metric.format(Math.abs(diff), b)}
                </td>
                <td className="num py-1.5 pl-2 text-right text-ink-soft">
                  {pct != null ? fmtPctSigned(pct) : bg.common.dash}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ay?: string; am?: string; by?: string; bm?: string }>;
}) {
  const { ay, am, by, bm } = await searchParams;
  const { derived } = await loadAppContext();

  if (derived.length < 2) {
    return (
      <div className="py-16 text-center text-ink-soft">
        <p>{bg.compare.needTwoMonths}</p>
        <Link href="/month" className="mt-2 inline-block underline">
          {bg.dashboard.emptyCta}
        </Link>
      </div>
    );
  }

  const last = derived[derived.length - 1]!;
  const b = findMonth(derived, Number(by) || last.year, Number(bm) || last.month) ?? last;
  const defaultA = prevOf(derived, b.year, b.month) ?? derived[0]!;
  const a =
    findMonth(derived, Number(ay) || defaultA.year, Number(am) || defaultA.month) ?? defaultA;

  const yoy = yoyOf(derived, b.year, b.month);
  const options = derived.map((d) => ({ year: d.year, month: d.month })).reverse();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-medium">{bg.compare.title}</h1>

      <Card title={bg.compare.freeCompare}>
        <div className="mb-4 flex flex-wrap gap-4">
          <MonthPicker
            options={options}
            selected={{ year: a.year, month: a.month }}
            paramNames={{ year: 'ay', month: 'am' }}
          />
          <MonthPicker
            options={options}
            selected={{ year: b.year, month: b.month }}
            paramNames={{ year: 'by', month: 'bm' }}
          />
        </div>
        <CompareTable a={a} b={b} />
      </Card>

      <Card title={bg.compare.yoyCompare}>
        {yoy ? (
          <CompareTable a={yoy} b={b} />
        ) : (
          <p className="text-sm text-ink-soft">{bg.compare.noYoY}</p>
        )}
      </Card>
    </div>
  );
}
