import Link from 'next/link';
import { MonthPicker } from '@/components/month-picker';
import { Card } from '@/components/ui/card';
import { topExpenses, topProducts, worstProducts } from '@/lib/calc/month';
import { safeDiv } from '@/lib/calc/money';
import {
  findMonth,
  loadAppContext,
} from '@/lib/db/queries';
import { fmtInt, fmtMoney, fmtMonth, fmtPct } from '@/lib/format';
import { bg } from '@/lib/i18n/bg';

export default async function MonthlyAnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const { y, m } = await searchParams;
  const { derived, settings } = await loadAppContext();

  if (derived.length === 0) {
    return (
      <div className="py-16 text-center text-ink-soft">
        <p>{bg.analysis.noMonthData}</p>
        <Link href="/month" className="mt-2 inline-block underline">
          {bg.dashboard.emptyCta}
        </Link>
      </div>
    );
  }

  const last = derived[derived.length - 1]!;
  const current = findMonth(derived, Number(y) || last.year, Number(m) || last.month) ?? last;

  const revenueNames = new Map(settings.revenueCategories.map((c) => [c.id, c.name]));
  const revenueRows = Object.entries(current.revenue)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([id, v]) => ({
      name: revenueNames.get(id) ?? id,
      amount: v,
      share: safeDiv(v, current.totalRevenue),
    }));

  const expenseRows = topExpenses(current, settings, 99);
  const top = topProducts(current.products, 5);
  const worst = worstProducts(current.products, 5);

  const observations: string[] = [];
  if (revenueRows[0]) {
    observations.push(
      `Най-силната приходна категория е „${revenueRows[0].name}" с ${fmtPct(revenueRows[0].share)} от оборота.`,
    );
  }
  if (expenseRows[0]) {
    observations.push(
      `Най-големият разход е „${expenseRows[0].name}": ${fmtMoney(expenseRows[0].amount)} (${fmtPct(expenseRows[0].shareOfExpenses)} от всички разходи).`,
    );
  }
  if (current.totalRevenue > 0) {
    observations.push(
      `От всеки 100 € оборот остават ${fmtMoney(current.margin * 100)} нетна печалба.`,
    );
  }
  if (top[0]) {
    observations.push(`Най-печеливш продукт: „${top[0].name}" с ${fmtMoney(top[0].profit)}.`);
  }

  const metrics: Array<[string, string]> = [
    [bg.dashboard.revenue, fmtMoney(current.totalRevenue)],
    [bg.dashboard.expenses, fmtMoney(current.totalExpenses)],
    [bg.analysis.grossProfit, fmtMoney(current.grossProfit)],
    [bg.analysis.toState, fmtMoney(current.totalToState)],
    [bg.dashboard.netProfit, fmtMoney(current.netProfit)],
    [bg.dashboard.margin, current.totalRevenue > 0 ? fmtPct(current.margin) : bg.common.dash],
    [bg.analysis.clients, fmtInt(current.clients)],
    [bg.analysis.avgTicket, current.clients > 0 ? fmtMoney(current.avgTicket) : bg.common.dash],
    [
      bg.analysis.revenuePerDay,
      current.workingDays > 0 ? fmtMoney(current.revenuePerWorkingDay) : bg.common.dash,
    ],
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-xl font-medium">
          {bg.analysis.monthlyTitle} — {fmtMonth(current.year, current.month)}
        </h1>
        <MonthPicker
          options={derived.map((d) => ({ year: d.year, month: d.month })).reverse()}
          selected={{ year: current.year, month: current.month }}
        />
      </div>

      <Card>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
          {metrics.map(([label, value]) => (
            <div key={label} className="flex flex-col border-b border-rule pb-1">
              <dt className="text-xs text-ink-soft">{label}</dt>
              <dd className="num font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={bg.analysis.revenueBreakdown}>
          {revenueRows.length === 0 ? (
            <p className="text-sm text-ink-soft">{bg.common.noData}</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {revenueRows.map((r) => (
                  <tr key={r.name} className="border-b border-rule last:border-0">
                    <td className="py-1.5 pr-2">{r.name}</td>
                    <td className="num py-1.5 text-right">{fmtMoney(r.amount)}</td>
                    <td className="num py-1.5 pl-2 text-right text-ink-soft">
                      {fmtPct(r.share)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title={bg.analysis.expenseBreakdown}>
          {expenseRows.length === 0 ? (
            <p className="text-sm text-ink-soft">{bg.common.noData}</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {expenseRows.map((r) => (
                  <tr key={r.categoryId} className="border-b border-rule last:border-0">
                    <td className="py-1.5 pr-2">{r.name}</td>
                    <td className="num py-1.5 text-right">{fmtMoney(r.amount)}</td>
                    <td className="num py-1.5 pl-2 text-right text-ink-soft">
                      {fmtPct(r.shareOfRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={bg.analysis.taxes}>
          <table className="w-full text-sm">
            <tbody>
              {(
                [
                  [bg.monthEntry.taxes.vatCharged, current.taxes.vatCharged],
                  [bg.monthEntry.taxes.vatPaid, current.taxes.vatPaid],
                  [bg.monthEntry.taxes.vatDue, current.vatDue],
                  [bg.monthEntry.taxes.ownerInsurance, current.taxes.ownerInsurance],
                  [bg.monthEntry.taxes.extraInsurance, current.taxes.extraInsurance],
                  [bg.monthEntry.taxes.corpTax, current.taxes.corpTax],
                  [bg.monthEntry.taxes.otherObligations, current.taxes.otherObligations],
                  [bg.monthEntry.taxes.totalToState, current.totalToState],
                ] as Array<[string, number]>
              ).map(([label, v], i, arr) => (
                <tr
                  key={label}
                  className={`border-b border-rule last:border-0 ${
                    i === arr.length - 1 ? 'font-semibold' : ''
                  }`}
                >
                  <td className="py-1.5 pr-2">{label}</td>
                  <td className="num py-1.5 text-right">{fmtMoney(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title={bg.analysis.cashflowTitle}>
          <table className="w-full text-sm">
            <tbody>
              {(
                [
                  [bg.monthEntry.cashflow.inCash, current.cashflow.inCash],
                  [bg.monthEntry.cashflow.inBank, current.cashflow.inBank],
                  [bg.monthEntry.cashflow.outCash, current.cashflow.outCash],
                  [bg.monthEntry.cashflow.outBank, current.cashflow.outBank],
                  [bg.monthEntry.cashflow.receivables, current.cashflow.receivables],
                  [bg.monthEntry.cashflow.payables, current.cashflow.payables],
                  [bg.monthEntry.cashflow.computedCashEnd, current.computedCashEnd],
                  [bg.monthEntry.cashflow.discrepancy, current.cashDiscrepancy],
                ] as Array<[string, number]>
              ).map(([label, v]) => (
                <tr key={label} className="border-b border-rule last:border-0">
                  <td className="py-1.5 pr-2">{label}</td>
                  <td className="num py-1.5 text-right">{fmtMoney(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {(top.length > 0 || worst.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title={`${bg.analysis.products}: ${bg.analysis.topProducts}`}>
            <table className="w-full text-sm">
              <tbody>
                {top.map((p) => (
                  <tr key={p.name} className="border-b border-rule last:border-0">
                    <td className="py-1.5 pr-2">{p.name}</td>
                    <td className="num py-1.5 text-right">{fmtMoney(p.profit)}</td>
                    <td className="num py-1.5 pl-2 text-right text-ink-soft">
                      {p.profitPerHour != null
                        ? `${fmtMoney(p.profitPerHour)}/ч`
                        : bg.common.dash}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card title={`${bg.analysis.products}: ${bg.analysis.worstProducts}`}>
            <table className="w-full text-sm">
              <tbody>
                {worst.map((p) => (
                  <tr key={p.name} className="border-b border-rule last:border-0">
                    <td className="py-1.5 pr-2">{p.name}</td>
                    <td className="num py-1.5 text-right">{fmtMoney(p.profit)}</td>
                    <td className="num py-1.5 pl-2 text-right text-ink-soft">
                      {fmtPct(p.margin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {observations.length > 0 && (
        <Card title={bg.analysis.observations}>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
            {observations.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
