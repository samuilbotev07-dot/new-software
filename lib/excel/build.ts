/**
 * Сглобява Excel работна книга от данните. Изцяло client-side.
 * Листове: Настройки · по един на месец · Годишно обобщение.
 */
import type { WorkBook } from 'xlsx';
import { round2 } from '@/lib/calc/money';
import type { CalcSettings, MonthDerived, MonthInput } from '@/lib/calc/types';
import { fmtMonth, monthKey } from '@/lib/format';
import { bg } from '@/lib/i18n/bg';
import type { ProfileRow, SettingsRow } from '@/lib/db/types';

type Cell = string | number | null;

function catName(s: CalcSettings, kind: 'revenue' | 'expense', id: string): string {
  const list = kind === 'revenue' ? s.revenueCategories : s.expenseCategories;
  return list.find((c) => c.id === id)?.name ?? id;
}

function settingsSheet(profile: ProfileRow | null, row: SettingsRow | null, s: CalcSettings): Cell[][] {
  const t = bg.settings;
  return [
    [bg.app.name],
    [],
    [t.business.businessName, profile?.business_name ?? ''],
    [t.business.businessType, profile?.business_type ?? ''],
    [t.business.city, profile?.city ?? ''],
    [t.business.ownerName, profile?.owner_name ?? ''],
    [t.business.employees, profile?.employees ?? ''],
    [t.business.taxRegime, profile?.tax_regime ?? ''],
    [t.business.defaultWorkingDays, profile?.default_working_days ?? ''],
    [],
    [t.goals.targetProfit, round2(s.targetProfit)],
    [t.goals.minMargin, round2(s.minMargin * 100)],
    [t.goals.minCashBuffer, round2(s.minCashBuffer)],
    [t.goals.targetClients, s.targetClients],
    [t.goals.goals12m, row?.goals_12m ?? ''],
    [t.goals.biggestProblem, row?.biggest_problem ?? ''],
    [t.goals.top3Priorities, row?.top3_priorities ?? ''],
    [],
    [t.categories.revenue],
    ...s.revenueCategories.map((c): Cell[] => [c.name, c.active ? '' : '(скрита)']),
    [],
    [t.categories.expenses],
    ...s.expenseCategories.map((c): Cell[] => [c.name, c.active ? '' : '(скрита)']),
  ];
}

function monthSheet(input: MonthInput, d: MonthDerived, s: CalcSettings): Cell[][] {
  const e = bg.monthEntry;
  const rows: Cell[][] = [
    [fmtMonth(d.year, d.month)],
    [],
    [e.basics.workingDays, d.workingDays],
    [e.basics.clients, d.clients],
    [e.basics.transactions, d.transactions],
    [e.basics.cashStart, round2(d.cashStart)],
    [e.basics.cashEnd, round2(d.cashEnd)],
    [],
    [e.sections.revenue],
  ];
  for (const [id, v] of Object.entries(input.revenue)) {
    rows.push([catName(s, 'revenue', id), round2(v)]);
  }
  rows.push([bg.common.total, round2(d.totalRevenue)], [], [e.sections.expenses]);
  for (const [id, v] of Object.entries(input.expenses)) {
    rows.push([catName(s, 'expense', id), round2(v)]);
  }
  rows.push(
    [bg.common.total, round2(d.totalExpenses)],
    [],
    [e.sections.taxes],
    [e.taxes.vatCharged, round2(d.taxes.vatCharged)],
    [e.taxes.vatPaid, round2(d.taxes.vatPaid)],
    [e.taxes.vatDue, round2(d.vatDue)],
    [e.taxes.ownerInsurance, round2(d.taxes.ownerInsurance)],
    [e.taxes.extraInsurance, round2(d.taxes.extraInsurance)],
    [e.taxes.corpTax, round2(d.taxes.corpTax)],
    [e.taxes.otherObligations, round2(d.taxes.otherObligations)],
    [e.taxes.totalToState, round2(d.totalToState)],
    [],
    [bg.dashboard.netProfit, round2(d.netProfit)],
    [bg.dashboard.margin, round2(d.margin * 100)],
    [bg.analysis.avgTicket, round2(d.avgTicket)],
    [],
    [e.sections.cashflow],
    [e.cashflow.inCash, round2(d.cashflow.inCash)],
    [e.cashflow.inBank, round2(d.cashflow.inBank)],
    [e.cashflow.outCash, round2(d.cashflow.outCash)],
    [e.cashflow.outBank, round2(d.cashflow.outBank)],
    [e.cashflow.receivables, round2(d.cashflow.receivables)],
    [e.cashflow.payables, round2(d.cashflow.payables)],
    [e.cashflow.computedCashEnd, round2(d.computedCashEnd)],
    [e.cashflow.discrepancy, round2(d.cashDiscrepancy)],
  );
  if (d.products.length > 0) {
    rows.push(
      [],
      [e.sections.products],
      [e.products.name, e.products.price, e.products.cost, e.products.quantity, e.products.revenue, e.products.profit],
    );
    for (const p of d.products) {
      rows.push([p.name, round2(p.price), round2(p.cost), p.quantity, round2(p.revenue), round2(p.profit)]);
    }
  }
  const sa = input.selfAnalysis ?? {};
  const saEntries = Object.entries({
    [e.selfAnalysis.wentWell]: sa.wentWell,
    [e.selfAnalysis.wentBad]: sa.wentBad,
    [e.selfAnalysis.biggestProblem]: sa.biggestProblem,
    [e.selfAnalysis.bestProduct]: sa.bestProduct,
    [e.selfAnalysis.worstProduct]: sa.worstProduct,
    [e.selfAnalysis.toImprove]: sa.toImprove,
    [e.selfAnalysis.decisions]: sa.decisions,
    [e.selfAnalysis.questions]: sa.questions,
  }).filter(([, v]) => v && v.trim().length > 0);
  if (saEntries.length > 0) {
    rows.push([], [e.sections.selfAnalysis]);
    for (const [q, a] of saEntries) rows.push([q, a ?? '']);
  }
  if (input.notes && input.notes.trim()) {
    rows.push([], [e.notes, input.notes]);
  }
  return rows;
}

function yearlySheet(derived: MonthDerived[]): Cell[][] {
  const rows: Cell[][] = [
    [
      bg.common.month,
      bg.dashboard.revenue,
      bg.dashboard.expenses,
      bg.analysis.toState,
      bg.dashboard.netProfit,
      `${bg.dashboard.margin} %`,
      bg.analysis.clients,
      bg.dashboard.cash,
    ],
  ];
  for (const d of derived) {
    rows.push([
      fmtMonth(d.year, d.month),
      round2(d.totalRevenue),
      round2(d.totalExpenses),
      round2(d.totalToState),
      round2(d.netProfit),
      round2(d.margin * 100),
      d.clients,
      round2(d.cashEnd),
    ]);
  }
  if (derived.length > 0) {
    const sum = (f: (d: MonthDerived) => number) =>
      round2(derived.reduce((acc, d) => acc + f(d), 0));
    rows.push([
      bg.common.total,
      sum((d) => d.totalRevenue),
      sum((d) => d.totalExpenses),
      sum((d) => d.totalToState),
      sum((d) => d.netProfit),
      null,
      derived.reduce((acc, d) => acc + d.clients, 0),
      null,
    ]);
  }
  return rows;
}

export async function buildWorkbook(
  profile: ProfileRow | null,
  settingsRow: SettingsRow | null,
  settings: CalcSettings,
  inputs: MonthInput[],
  derived: MonthDerived[],
): Promise<WorkBook> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(settingsSheet(profile, settingsRow, settings)),
    bg.excel.settingsSheet,
  );

  for (let i = 0; i < derived.length; i++) {
    const d = derived[i]!;
    const input = inputs[i]!;
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(monthSheet(input, d, settings)),
      monthKey(d.year, d.month),
    );
  }

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(yearlySheet(derived)),
    bg.excel.yearlySheet,
  );

  return wb;
}
