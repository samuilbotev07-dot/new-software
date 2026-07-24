/** Преобразуване между редове от базата и домейн типовете на енджина. */
import { finite } from '@/lib/calc/money';
import type { CalcSettings, MonthInput } from '@/lib/calc/types';
import type { MonthRow, ProfileRow, SettingsRow } from './types';

/** numeric колоните на Supabase понякога идват като string. */
function num(v: unknown): number {
  if (typeof v === 'number') return finite(v);
  if (typeof v === 'string' && v.trim() !== '') return finite(Number(v));
  return 0;
}

function numMap(obj: unknown): Record<string, number> {
  if (!obj || typeof obj !== 'object') return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    out[k] = num(v);
  }
  return out;
}

export function settingsRowToCalc(row: SettingsRow): CalcSettings {
  return {
    targetProfit: num(row.target_profit),
    minMargin: num(row.min_margin),
    minCashBuffer: num(row.min_cash_buffer),
    targetClients: num(row.target_clients),
    revenueCategories: Array.isArray(row.revenue_categories) ? row.revenue_categories : [],
    expenseCategories: Array.isArray(row.expense_categories) ? row.expense_categories : [],
  };
}

export function monthRowToInput(row: MonthRow, profile?: ProfileRow | null): MonthInput {
  const taxes = (row.taxes ?? {}) as Record<string, unknown>;
  const cashflow = (row.cashflow ?? {}) as Record<string, unknown>;
  return {
    year: row.year,
    month: row.month,
    workingDays:
      row.working_days != null
        ? num(row.working_days)
        : num(profile?.default_working_days ?? 22),
    clients: num(row.clients),
    transactions: num(row.transactions),
    cashStart: num(row.cash_start),
    cashEnd: num(row.cash_end),
    revenue: numMap(row.revenue),
    expenses: numMap(row.expenses),
    taxes: {
      vatCharged: num(taxes.vatCharged),
      vatPaid: num(taxes.vatPaid),
      ownerInsurance: num(taxes.ownerInsurance),
      extraInsurance: num(taxes.extraInsurance),
      corpTax: num(taxes.corpTax),
      otherObligations: num(taxes.otherObligations),
    },
    cashflow: {
      inCash: num(cashflow.inCash),
      inBank: num(cashflow.inBank),
      outCash: num(cashflow.outCash),
      outBank: num(cashflow.outBank),
      receivables: num(cashflow.receivables),
      payables: num(cashflow.payables),
    },
    products: Array.isArray(row.products)
      ? row.products.map((p) => ({
          catalogId: p.catalogId,
          name: String(p.name ?? ''),
          price: num(p.price),
          cost: num(p.cost),
          quantity: num(p.quantity),
          durationMinutes: p.durationMinutes != null ? num(p.durationMinutes) : null,
          note: p.note,
        }))
      : [],
    selfAnalysis: row.self_analysis ?? {},
    notes: row.notes ?? '',
  };
}
