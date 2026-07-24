import Link from 'next/link';
import { ReceiptStrip } from '@/components/receipt-strip';
import { Card } from '@/components/ui/card';
import { WarningsList } from '@/components/warnings-list';
import { computeHealth } from '@/lib/calc/health';
import { computeMonth, topExpenses } from '@/lib/calc/month';
import { computeWarnings } from '@/lib/calc/warnings';
import { demoMonth, demoPrevMonth, demoSettings } from '@/lib/demo/sample';
import { fmtMoney, fmtPct } from '@/lib/format';
import { bg } from '@/lib/i18n/bg';

/** Демо режим: примерен месец на фиктивен салон, нищо не пише в базата. */
export default function DemoPage() {
  const prev = computeMonth(demoPrevMonth, demoSettings);
  const current = computeMonth(demoMonth, demoSettings, [prev]);
  const health = computeHealth(current, [prev], demoSettings);
  const warnings = computeWarnings(current, prev, null, demoSettings);
  const expenses = topExpenses(current, demoSettings, 5);

  const stats: Array<[string, string]> = [
    [bg.dashboard.revenue, fmtMoney(current.totalRevenue, 0)],
    [bg.dashboard.expenses, fmtMoney(current.totalExpenses, 0)],
    [bg.dashboard.netProfit, fmtMoney(current.netProfit, 0)],
    [bg.dashboard.margin, fmtPct(current.margin)],
    [bg.dashboard.cash, fmtMoney(current.cashEnd, 0)],
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-sm border border-amber bg-amber-soft px-3 py-2 text-sm">
        {bg.demo.banner}{' '}
        <Link href="/" className="font-medium underline">
          {bg.demo.exit}
        </Link>
      </div>

      <h1 className="font-display text-xl font-medium">
        Салон „Мария&ldquo; — {bg.dashboard.title}
      </h1>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-sm border border-rule bg-card px-3 py-3">
            <p className="text-xs text-ink-soft">{label}</p>
            <p className="num mt-1 text-lg font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={bg.dashboard.healthTitle}>
          <div className="flex items-center gap-4">
            <span className="num font-display text-4xl font-bold">{health.total}</span>
            <p className="font-medium">{bg.health.status[health.status]}</p>
          </div>
          <ul className="mt-3 flex flex-col gap-1 text-sm text-ink-soft">
            {health.categories
              .filter((c) => c.score != null)
              .slice(0, 5)
              .map((c) => (
                <li key={c.key}>
                  {c.label}: <strong className="num">{c.score}</strong>
                </li>
              ))}
          </ul>
        </Card>

        <Card title={bg.dashboard.warningsTitle} className="lg:col-span-2">
          {warnings.length === 0 ? (
            <p className="text-sm text-ledger">{bg.dashboard.noWarnings}</p>
          ) : (
            <WarningsList warnings={warnings} />
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={bg.dashboard.topExpensesTitle} className="lg:col-span-2">
          <table className="w-full text-sm">
            <tbody>
              {expenses.map((e) => (
                <tr key={e.categoryId} className="border-b border-rule last:border-0">
                  <td className="py-1.5 pr-2">{e.name}</td>
                  <td className="num py-1.5 text-right">{fmtMoney(e.amount)}</td>
                  <td className="num py-1.5 pl-2 text-right text-ink-soft">
                    {fmtPct(e.shareOfRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <ReceiptStrip d={current} />
      </div>
    </div>
  );
}
