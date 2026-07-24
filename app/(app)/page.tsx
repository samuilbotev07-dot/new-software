import Link from 'next/link';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { MonthPicker } from '@/components/month-picker';
import { ReceiptStrip } from '@/components/receipt-strip';
import { Card } from '@/components/ui/card';
import { WarningsList } from '@/components/warnings-list';
import { computeHealth } from '@/lib/calc/health';
import { topExpenses } from '@/lib/calc/month';
import { safeDiv } from '@/lib/calc/money';
import { computeWarnings } from '@/lib/calc/warnings';
import {
  historyBefore,
  loadAppContext,
  findMonth,
  prevOf,
  yoyOf,
} from '@/lib/db/queries';
import { fmtMonthShort, fmtMoney, fmtPct, fmtPctSigned } from '@/lib/format';
import { bg } from '@/lib/i18n/bg';

function Stat({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta?: string | null;
  tone?: 'good' | 'bad' | null;
}) {
  return (
    <div className="rounded-sm border border-rule bg-card px-3 py-3">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="num mt-1 text-lg font-semibold sm:text-xl">{value}</p>
      {delta ? (
        <p
          className={`num mt-0.5 text-xs ${
            tone === 'good' ? 'text-ledger' : tone === 'bad' ? 'text-stamp' : 'text-ink-soft'
          }`}
        >
          {delta} {bg.common.vsPrevMonth}
        </p>
      ) : null}
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const { y, m } = await searchParams;
  const ctx = await loadAppContext();
  const { derived, settings, profile } = ctx;

  if (derived.length === 0) {
    const now = new Date();
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
        <h1 className="font-display text-xl font-medium">{bg.dashboard.emptyTitle}</h1>
        <p className="text-ink-soft">{bg.dashboard.emptyBody}</p>
        <Link
          href={`/month/${now.getFullYear()}/${now.getMonth() + 1}`}
          className="rounded-sm bg-ink px-4 py-2 text-sm font-medium text-paper"
        >
          {bg.dashboard.emptyCta}
        </Link>
        {profile && !profile.onboarding_completed ? (
          <Link href="/onboarding" className="text-sm text-ink-soft underline">
            {bg.onboarding.title}
          </Link>
        ) : null}
        <Link href="/demo" className="text-sm text-ink-soft underline">
          {bg.demo.cta}
        </Link>
      </div>
    );
  }

  const last = derived[derived.length - 1]!;
  const selYear = Number(y) || last.year;
  const selMonth = Number(m) || last.month;
  const current = findMonth(derived, selYear, selMonth) ?? last;

  const prev = prevOf(derived, current.year, current.month);
  const yoy = yoyOf(derived, current.year, current.month);
  const history = historyBefore(derived, current.year, current.month);

  const health = computeHealth(current, history, settings);
  const warnings = computeWarnings(current, prev, yoy, settings);
  const expenses = topExpenses(current, settings, 5);

  const delta = (cur: number, prv: number | undefined) =>
    prv == null || prv === 0 ? null : fmtPctSigned(safeDiv(cur - prv, Math.abs(prv)));

  const chartData = derived.slice(-12).map((d) => ({
    label: fmtMonthShort(d.year, d.month),
    revenue: d.totalRevenue,
    profit: d.netProfit,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-xl font-medium">{bg.dashboard.title}</h1>
        <MonthPicker
          options={derived.map((d) => ({ year: d.year, month: d.month })).reverse()}
          selected={{ year: current.year, month: current.month }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Stat
          label={bg.dashboard.revenue}
          value={fmtMoney(current.totalRevenue, 0)}
          delta={delta(current.totalRevenue, prev?.totalRevenue)}
          tone={
            prev && prev.totalRevenue !== 0
              ? current.totalRevenue >= prev.totalRevenue
                ? 'good'
                : 'bad'
              : null
          }
        />
        <Stat
          label={bg.dashboard.expenses}
          value={fmtMoney(current.totalExpenses, 0)}
          delta={delta(current.totalExpenses, prev?.totalExpenses)}
          tone={
            prev && prev.totalExpenses !== 0
              ? current.totalExpenses <= prev.totalExpenses
                ? 'good'
                : 'bad'
              : null
          }
        />
        <Stat
          label={bg.dashboard.netProfit}
          value={fmtMoney(current.netProfit, 0)}
          delta={delta(current.netProfit, prev?.netProfit)}
          tone={
            prev && prev.netProfit !== 0
              ? current.netProfit >= prev.netProfit
                ? 'good'
                : 'bad'
              : null
          }
        />
        <Stat
          label={bg.dashboard.margin}
          value={current.totalRevenue > 0 ? fmtPct(current.margin) : bg.common.dash}
        />
        <Stat
          label={bg.dashboard.cash}
          value={fmtMoney(current.cashEnd, 0)}
          delta={delta(current.cashEnd, prev?.cashEnd)}
          tone={
            prev && prev.cashEnd !== 0
              ? current.cashEnd >= prev.cashEnd
                ? 'good'
                : 'bad'
              : null
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={bg.dashboard.healthTitle} className="lg:col-span-1">
          <div className="flex items-center gap-4">
            <span className="num font-display text-4xl font-bold">{health.total}</span>
            <div>
              <p className="font-medium">{bg.health.status[health.status]}</p>
              <Link href="/health" className="text-sm text-ink-soft underline">
                {bg.dashboard.healthLink}
              </Link>
            </div>
          </div>
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
          {expenses.length === 0 ? (
            <p className="text-sm text-ink-soft">{bg.common.noData}</p>
          ) : (
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
          )}
        </Card>

        <div className="lg:col-span-1">
          <ReceiptStrip d={current} />
          <div className="mt-3 text-center">
            <Link
              href={`/month/${current.year}/${current.month}`}
              className="text-sm underline"
            >
              {bg.dashboard.enterMonth}
            </Link>
          </div>
        </div>
      </div>

      <Card title={bg.dashboard.chartTitle}>
        <RevenueChart data={chartData} />
      </Card>
    </div>
  );
}
