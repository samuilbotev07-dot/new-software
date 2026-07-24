'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { NumberField, TextAreaField } from '@/components/ui/field';
import { computeMonth } from '@/lib/calc/month';
import { safeDiv } from '@/lib/calc/money';
import type {
  CalcSettings,
  MonthInput,
  ProductInput,
  SelfAnalysis,
} from '@/lib/calc/types';
import type { CatalogRow } from '@/lib/db/types';
import { fmtMoney, fmtMonth, fmtPct } from '@/lib/format';
import { bg } from '@/lib/i18n/bg';
import { createClient } from '@/lib/supabase/client';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function Section({
  title,
  children,
  defaultOpen = false,
  filled,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  filled: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-sm border border-rule bg-card"
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          {title}
          {filled ? (
            <span aria-hidden="true" className="text-ledger">
              ✓
            </span>
          ) : null}
        </span>
        <span
          aria-hidden="true"
          className="text-ink-soft transition-transform group-open:rotate-90"
        >
          ›
        </span>
      </summary>
      <div className="border-t border-rule p-4">{children}</div>
    </details>
  );
}

export function MonthEntryForm({
  initial,
  settings,
  catalog,
  exists,
}: {
  initial: MonthInput;
  settings: CalcSettings;
  catalog: CatalogRow[];
  exists: boolean;
}) {
  const [data, setData] = useState<MonthInput>(initial);
  const [saveState, setSaveState] = useState<SaveState>(exists ? 'saved' : 'idle');
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const derived = useMemo(() => computeMonth(data, settings), [data, settings]);

  const save = useCallback(async (payload: MonthInput) => {
    setSaveState('saving');
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaveState('error');
      return;
    }
    const { error } = await supabase.from('months').upsert(
      {
        user_id: user.id,
        year: payload.year,
        month: payload.month,
        working_days: payload.workingDays,
        clients: payload.clients,
        transactions: payload.transactions,
        cash_start: payload.cashStart,
        cash_end: payload.cashEnd,
        revenue: payload.revenue,
        expenses: payload.expenses,
        taxes: payload.taxes,
        cashflow: payload.cashflow,
        products: payload.products,
        self_analysis: payload.selfAnalysis ?? {},
        notes: payload.notes ?? '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,year,month' },
    );
    setSaveState(error ? 'error' : 'saved');
  }, []);

  // Автозапис с debounce 800 ms.
  const update = useCallback(
    (patch: Partial<MonthInput>) => {
      setData((prev) => {
        const next = { ...prev, ...patch };
        dirtyRef.current = true;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          dirtyRef.current = false;
          void save(next);
        }, 800);
        return next;
      });
    },
    [save],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const activeRevenue = settings.revenueCategories
    .filter((c) => c.active)
    .sort((a, b) => a.order - b.order);
  const activeExpenses = settings.expenseCategories
    .filter((c) => c.active)
    .sort((a, b) => a.order - b.order);

  const sa: SelfAnalysis = data.selfAnalysis ?? {};
  const updateSa = (patch: Partial<SelfAnalysis>) =>
    update({ selfAnalysis: { ...sa, ...patch } });

  const sectionsFilled = [
    data.workingDays > 0 || data.clients > 0 || data.cashStart !== 0 || data.cashEnd !== 0,
    Object.values(data.revenue).some((v) => v > 0),
    Object.values(data.expenses).some((v) => v > 0),
    Object.values(data.taxes).some((v) => (v ?? 0) > 0),
    data.products.length > 0,
    Object.values(data.cashflow).some((v) => (v ?? 0) !== 0),
    Object.values(sa).some((v) => v && v.trim().length > 0),
  ];
  const progress = sectionsFilled.filter(Boolean).length;

  const updateProduct = (index: number, patch: Partial<ProductInput>) => {
    const products = data.products.map((p, i) => (i === index ? { ...p, ...patch } : p));
    update({ products });
  };

  const saveLabel =
    saveState === 'saving'
      ? bg.common.saving
      : saveState === 'saved'
        ? bg.common.saved
        : saveState === 'error'
          ? bg.common.saveError
          : '';

  const prevMonth = data.month === 1 ? { y: data.year - 1, m: 12 } : { y: data.year, m: data.month - 1 };
  const nextMonth = data.month === 12 ? { y: data.year + 1, m: 1 } : { y: data.year, m: data.month + 1 };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Link
            href={`/month/${prevMonth.y}/${prevMonth.m}`}
            aria-label={bg.common.back}
            className="rounded-sm border border-rule px-2 py-1 text-sm hover:bg-rule/40"
          >
            ‹
          </Link>
          <h1 className="px-1 font-display text-lg font-medium">
            {fmtMonth(data.year, data.month)}
          </h1>
          <Link
            href={`/month/${nextMonth.y}/${nextMonth.m}`}
            aria-label={bg.common.next}
            className="rounded-sm border border-rule px-2 py-1 text-sm hover:bg-rule/40"
          >
            ›
          </Link>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-ink-soft">
            {bg.monthEntry.progress}: {progress}/7
          </span>
          <span
            role="status"
            className={
              saveState === 'error'
                ? 'text-stamp'
                : saveState === 'saved'
                  ? 'text-ledger'
                  : 'text-ink-soft'
            }
          >
            {saveLabel}
          </span>
        </div>
      </div>

      {/* 1. Основни данни */}
      <Section title={bg.monthEntry.sections.basics} defaultOpen filled={sectionsFilled[0]!}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <NumberField
            label={bg.monthEntry.basics.workingDays}
            value={data.workingDays}
            onChange={(v) => update({ workingDays: v })}
            integer
          />
          <NumberField
            label={bg.monthEntry.basics.clients}
            value={data.clients}
            onChange={(v) => update({ clients: v })}
            integer
          />
          <NumberField
            label={bg.monthEntry.basics.transactions}
            value={data.transactions}
            onChange={(v) => update({ transactions: v })}
            integer
          />
          <NumberField
            label={bg.monthEntry.basics.cashStart}
            value={data.cashStart}
            onChange={(v) => update({ cashStart: v })}
            suffix="€"
          />
          <NumberField
            label={bg.monthEntry.basics.cashEnd}
            value={data.cashEnd}
            onChange={(v) => update({ cashEnd: v })}
            suffix="€"
          />
        </div>
      </Section>

      {/* 2. Приходи */}
      <Section title={bg.monthEntry.sections.revenue} defaultOpen filled={sectionsFilled[1]!}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {activeRevenue.map((c) => (
            <NumberField
              key={c.id}
              label={c.name}
              value={data.revenue[c.id] ?? 0}
              onChange={(v) => update({ revenue: { ...data.revenue, [c.id]: v } })}
              suffix="€"
            />
          ))}
        </div>
        <p className="num mt-3 border-t border-rule pt-2 text-right text-sm font-medium">
          {bg.common.total}: {fmtMoney(derived.totalRevenue)}
        </p>
      </Section>

      {/* 3. Разходи */}
      <Section title={bg.monthEntry.sections.expenses} filled={sectionsFilled[2]!}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {activeExpenses.map((c) => {
            const amount = data.expenses[c.id] ?? 0;
            const share = safeDiv(amount, derived.totalRevenue);
            return (
              <NumberField
                key={c.id}
                label={c.name}
                value={amount}
                onChange={(v) => update({ expenses: { ...data.expenses, [c.id]: v } })}
                suffix="€"
                hint={
                  amount > 0 && derived.totalRevenue > 0
                    ? `${fmtPct(share)} ${bg.monthEntry.expenses.shareOfRevenue}`
                    : undefined
                }
              />
            );
          })}
        </div>
        <p className="num mt-3 border-t border-rule pt-2 text-right text-sm font-medium">
          {bg.common.total}: {fmtMoney(derived.totalExpenses)}
        </p>
      </Section>

      {/* 4. Задължения към държавата */}
      <Section title={bg.monthEntry.sections.taxes} filled={sectionsFilled[3]!}>
        <p className="mb-3 text-sm text-ink-soft">{bg.monthEntry.taxes.hint}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NumberField
            label={bg.monthEntry.taxes.vatCharged}
            value={data.taxes.vatCharged ?? 0}
            onChange={(v) => update({ taxes: { ...data.taxes, vatCharged: v } })}
            suffix="€"
          />
          <NumberField
            label={bg.monthEntry.taxes.vatPaid}
            value={data.taxes.vatPaid ?? 0}
            onChange={(v) => update({ taxes: { ...data.taxes, vatPaid: v } })}
            suffix="€"
          />
        </div>
        <p className="num my-3 rounded-sm bg-ledger-soft px-3 py-2 text-sm">
          {bg.monthEntry.taxes.vatDue}: <strong>{fmtMoney(derived.vatDue)}</strong>
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NumberField
            label={bg.monthEntry.taxes.ownerInsurance}
            value={data.taxes.ownerInsurance ?? 0}
            onChange={(v) => update({ taxes: { ...data.taxes, ownerInsurance: v } })}
            suffix="€"
          />
          <NumberField
            label={bg.monthEntry.taxes.extraInsurance}
            value={data.taxes.extraInsurance ?? 0}
            onChange={(v) => update({ taxes: { ...data.taxes, extraInsurance: v } })}
            suffix="€"
          />
          <NumberField
            label={bg.monthEntry.taxes.corpTax}
            value={data.taxes.corpTax ?? 0}
            onChange={(v) => update({ taxes: { ...data.taxes, corpTax: v } })}
            suffix="€"
          />
          <NumberField
            label={bg.monthEntry.taxes.otherObligations}
            value={data.taxes.otherObligations ?? 0}
            onChange={(v) => update({ taxes: { ...data.taxes, otherObligations: v } })}
            suffix="€"
          />
        </div>
        <p className="num mt-3 border-t border-rule pt-2 text-right text-sm font-medium">
          {bg.monthEntry.taxes.totalToState}: {fmtMoney(derived.totalToState)}
        </p>
      </Section>

      {/* 5. Продукти и услуги */}
      <Section title={bg.monthEntry.sections.products} filled={sectionsFilled[4]!}>
        {catalog.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {catalog.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  update({
                    products: [
                      ...data.products,
                      {
                        catalogId: c.id,
                        name: c.name,
                        price: c.default_price,
                        cost: c.default_cost,
                        quantity: 0,
                        durationMinutes: c.duration_minutes,
                      },
                    ],
                  })
                }
                className="rounded-sm border border-rule px-2 py-1 text-sm hover:bg-rule/40"
              >
                + {c.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="mb-3 text-sm text-ink-soft">{bg.monthEntry.products.emptyCatalog}</p>
        )}

        {data.products.length === 0 ? (
          <p className="text-sm text-ink-soft">{bg.monthEntry.products.empty}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {data.products.map((p, i) => (
              <li key={i} className="rounded-sm border border-rule p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <input
                    aria-label={bg.monthEntry.products.name}
                    value={p.name}
                    onChange={(e) => updateProduct(i, { name: e.target.value })}
                    className="w-full min-h-9 rounded-sm border border-rule bg-card px-2 py-1 text-sm font-medium"
                  />
                  <button
                    type="button"
                    aria-label={bg.common.delete}
                    onClick={() =>
                      update({ products: data.products.filter((_, j) => j !== i) })
                    }
                    className="shrink-0 rounded-sm border border-rule px-2 py-1 text-sm text-stamp hover:bg-stamp-soft"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <NumberField
                    label={bg.monthEntry.products.price}
                    value={p.price}
                    onChange={(v) => updateProduct(i, { price: v })}
                    suffix="€"
                  />
                  <NumberField
                    label={bg.monthEntry.products.cost}
                    value={p.cost}
                    onChange={(v) => updateProduct(i, { cost: v })}
                    suffix="€"
                  />
                  <NumberField
                    label={bg.monthEntry.products.quantity}
                    value={p.quantity}
                    onChange={(v) => updateProduct(i, { quantity: v })}
                    integer
                  />
                </div>
                <p className="num mt-2 text-right text-sm text-ink-soft">
                  {bg.monthEntry.products.revenue}:{' '}
                  {fmtMoney(derived.products[i]?.revenue ?? 0)} ·{' '}
                  {bg.monthEntry.products.profit}:{' '}
                  {fmtMoney(derived.products[i]?.profit ?? 0)}
                </p>
              </li>
            ))}
          </ul>
        )}
        <Button
          type="button"
          variant="ghost"
          className="mt-3"
          onClick={() =>
            update({
              products: [
                ...data.products,
                { name: '', price: 0, cost: 0, quantity: 0 },
              ],
            })
          }
        >
          {bg.monthEntry.products.addRow}
        </Button>
      </Section>

      {/* 6. Кешфлоу */}
      <Section title={bg.monthEntry.sections.cashflow} filled={sectionsFilled[5]!}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NumberField
            label={bg.monthEntry.cashflow.inCash}
            value={data.cashflow.inCash ?? 0}
            onChange={(v) => update({ cashflow: { ...data.cashflow, inCash: v } })}
            suffix="€"
          />
          <NumberField
            label={bg.monthEntry.cashflow.inBank}
            value={data.cashflow.inBank ?? 0}
            onChange={(v) => update({ cashflow: { ...data.cashflow, inBank: v } })}
            suffix="€"
          />
          <NumberField
            label={bg.monthEntry.cashflow.outCash}
            value={data.cashflow.outCash ?? 0}
            onChange={(v) => update({ cashflow: { ...data.cashflow, outCash: v } })}
            suffix="€"
          />
          <NumberField
            label={bg.monthEntry.cashflow.outBank}
            value={data.cashflow.outBank ?? 0}
            onChange={(v) => update({ cashflow: { ...data.cashflow, outBank: v } })}
            suffix="€"
          />
          <NumberField
            label={bg.monthEntry.cashflow.receivables}
            value={data.cashflow.receivables ?? 0}
            onChange={(v) => update({ cashflow: { ...data.cashflow, receivables: v } })}
            suffix="€"
          />
          <NumberField
            label={bg.monthEntry.cashflow.payables}
            value={data.cashflow.payables ?? 0}
            onChange={(v) => update({ cashflow: { ...data.cashflow, payables: v } })}
            suffix="€"
          />
        </div>
        <div className="num mt-3 flex flex-col gap-1 border-t border-rule pt-2 text-right text-sm">
          <span>
            {bg.monthEntry.cashflow.computedCashEnd}:{' '}
            <strong>{fmtMoney(derived.computedCashEnd)}</strong>
          </span>
          <span className={derived.cashDiscrepancy !== 0 ? 'text-amber' : 'text-ledger'}>
            {bg.monthEntry.cashflow.discrepancy}: {fmtMoney(derived.cashDiscrepancy)}
          </span>
        </div>
        {Math.abs(derived.cashDiscrepancy) > 0.02 * derived.totalRevenue &&
        derived.totalRevenue > 0 ? (
          <p className="mt-2 text-sm text-ink-soft">
            {bg.monthEntry.cashflow.discrepancyHint}
          </p>
        ) : null}
      </Section>

      {/* 7. Самоанализ */}
      <Section title={bg.monthEntry.sections.selfAnalysis} filled={sectionsFilled[6]!}>
        <div className="flex flex-col gap-3">
          <TextAreaField
            label={bg.monthEntry.selfAnalysis.wentWell}
            value={sa.wentWell ?? ''}
            onChange={(v) => updateSa({ wentWell: v })}
          />
          <TextAreaField
            label={bg.monthEntry.selfAnalysis.wentBad}
            value={sa.wentBad ?? ''}
            onChange={(v) => updateSa({ wentBad: v })}
          />
          <TextAreaField
            label={bg.monthEntry.selfAnalysis.biggestProblem}
            value={sa.biggestProblem ?? ''}
            onChange={(v) => updateSa({ biggestProblem: v })}
          />
          <TextAreaField
            label={bg.monthEntry.selfAnalysis.bestProduct}
            value={sa.bestProduct ?? ''}
            onChange={(v) => updateSa({ bestProduct: v })}
          />
          <TextAreaField
            label={bg.monthEntry.selfAnalysis.worstProduct}
            value={sa.worstProduct ?? ''}
            onChange={(v) => updateSa({ worstProduct: v })}
          />
          <TextAreaField
            label={bg.monthEntry.selfAnalysis.toImprove}
            value={sa.toImprove ?? ''}
            onChange={(v) => updateSa({ toImprove: v })}
          />
          <TextAreaField
            label={bg.monthEntry.selfAnalysis.decisions}
            value={sa.decisions ?? ''}
            onChange={(v) => updateSa({ decisions: v })}
          />
          <TextAreaField
            label={bg.monthEntry.selfAnalysis.questions}
            value={sa.questions ?? ''}
            onChange={(v) => updateSa({ questions: v })}
          />
          <TextAreaField
            label={bg.monthEntry.notes}
            value={data.notes ?? ''}
            onChange={(v) => update({ notes: v })}
          />
        </div>
      </Section>

      {/* Живо обобщение — фиксирана лента долу на телефон */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-rule bg-card/95 backdrop-blur">
        <div className="num mx-auto grid max-w-5xl grid-cols-4 gap-1 px-3 py-2 text-center text-xs sm:text-sm">
          <div>
            <div className="text-ink-soft">{bg.monthEntry.summary.revenue}</div>
            <div className="font-medium">{fmtMoney(derived.totalRevenue, 0)}</div>
          </div>
          <div>
            <div className="text-ink-soft">{bg.monthEntry.summary.expenses}</div>
            <div className="font-medium">{fmtMoney(derived.totalExpenses, 0)}</div>
          </div>
          <div>
            <div className="text-ink-soft">{bg.monthEntry.summary.netProfit}</div>
            <div
              className={`font-medium ${derived.netProfit < 0 ? 'text-stamp' : 'text-ledger'}`}
            >
              {fmtMoney(derived.netProfit, 0)}
            </div>
          </div>
          <div>
            <div className="text-ink-soft">{bg.monthEntry.summary.margin}</div>
            <div className="font-medium">
              {derived.totalRevenue > 0 ? fmtPct(derived.margin) : bg.common.dash}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
