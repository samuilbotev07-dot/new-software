import type { MonthDerived } from '@/lib/calc/types';
import { fmtMoney, fmtMonth, fmtPct } from '@/lib/format';
import { bg } from '@/lib/i18n/bg';

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 ${strong ? 'font-semibold' : ''}`}
    >
      <span className="text-ink-soft">{label}</span>
      <span className="num">{value}</span>
    </div>
  );
}

/** Касова лента — подписният елемент. Месечното обобщение като бележка от каса. */
export function ReceiptStrip({ d }: { d: MonthDerived }) {
  return (
    <div className="mx-auto w-full max-w-xs">
      <div className="receipt rounded-t-sm px-4 py-4 text-sm">
        <p className="mb-1 text-center text-xs uppercase tracking-widest text-ink-soft">
          {bg.dashboard.receiptTitle}
        </p>
        <p className="num mb-3 text-center text-xs text-ink-soft">
          {fmtMonth(d.year, d.month)}
        </p>
        <div className="flex flex-col gap-1.5 border-t border-dashed border-rule pt-3">
          <Row label={bg.dashboard.revenue} value={fmtMoney(d.totalRevenue)} />
          <Row label={bg.dashboard.expenses} value={fmtMoney(d.totalExpenses)} />
          <Row label={bg.analysis.toState} value={fmtMoney(d.totalToState)} />
          <div className="my-1 border-t border-dashed border-rule" />
          <Row label={bg.dashboard.netProfit} value={fmtMoney(d.netProfit)} strong />
          <Row
            label={bg.dashboard.margin}
            value={d.totalRevenue > 0 ? fmtPct(d.margin) : bg.common.dash}
          />
          <Row label={bg.dashboard.cash} value={fmtMoney(d.cashEnd)} />
        </div>
      </div>
      <div className="receipt-edge" aria-hidden="true" />
    </div>
  );
}
