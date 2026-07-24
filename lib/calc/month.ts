import { fromCents, safeDiv, sum, sumValues, subtract, toCents, finite } from './money';
import type {
  CalcSettings,
  MonthDerived,
  MonthInput,
  ProductDerived,
  ProductInput,
  RankedExpense,
} from './types';

function deriveProduct(p: ProductInput): ProductDerived {
  const quantity = Math.max(0, Math.trunc(finite(p.quantity)));
  const revenue = fromCents(toCents(p.price) * quantity);
  const totalCost = fromCents(toCents(p.cost) * quantity);
  const profit = subtract(revenue, totalCost);
  const margin = safeDiv(profit, revenue);
  const minutes = finite(p.durationMinutes ?? null);
  const hours = (minutes / 60) * quantity;
  const profitPerHour = minutes > 0 && quantity > 0 ? safeDiv(profit, hours) : null;
  return { ...p, quantity, revenue, totalCost, profit, margin, profitPerHour };
}

/**
 * Производните числа на един месец.
 * @param history Предходни месеци (възходящо по време), нужни за кеш буфера.
 *                Взимат се последните до 6. При липса — текущият месец.
 */
export function computeMonth(
  m: MonthInput,
  _s: CalcSettings,
  history: MonthDerived[] = [],
): MonthDerived {
  const taxes = {
    vatCharged: finite(m.taxes?.vatCharged),
    vatPaid: finite(m.taxes?.vatPaid),
    ownerInsurance: finite(m.taxes?.ownerInsurance),
    extraInsurance: finite(m.taxes?.extraInsurance),
    corpTax: finite(m.taxes?.corpTax),
    otherObligations: finite(m.taxes?.otherObligations),
  };
  const cashflow = {
    inCash: finite(m.cashflow?.inCash),
    inBank: finite(m.cashflow?.inBank),
    outCash: finite(m.cashflow?.outCash),
    outBank: finite(m.cashflow?.outBank),
    receivables: finite(m.cashflow?.receivables),
    payables: finite(m.cashflow?.payables),
  };

  const totalRevenue = sumValues(m.revenue);
  const totalExpenses = sumValues(m.expenses);
  const vatDue = Math.max(0, subtract(taxes.vatCharged, taxes.vatPaid));
  const totalToState = sum(
    vatDue,
    taxes.ownerInsurance,
    taxes.extraInsurance,
    taxes.corpTax,
    taxes.otherObligations,
  );
  const grossProfit = subtract(totalRevenue, totalExpenses);
  const netProfit = subtract(grossProfit, totalToState);
  const clients = Math.max(0, Math.trunc(finite(m.clients)));
  const workingDays = Math.max(0, Math.trunc(finite(m.workingDays)));
  const cashStart = finite(m.cashStart);
  const cashEnd = finite(m.cashEnd);

  const computedCashEnd = subtract(
    sum(cashStart, cashflow.inCash, cashflow.inBank),
    sum(cashflow.outCash, cashflow.outBank),
  );

  // Среден месечен реален разход (разходи + задължения към държавата)
  // от последните до 6 предходни месеца; без история — текущият месец.
  const burnHistory = history.slice(-6);
  const monthlyBurn =
    burnHistory.length > 0
      ? safeDiv(
          burnHistory.reduce(
            (acc, h) => acc + toCents(h.totalExpenses) + toCents(h.totalToState),
            0,
          ),
          burnHistory.length,
        ) / 100
      : sum(totalExpenses, totalToState);

  return {
    year: m.year,
    month: m.month,
    workingDays,
    clients,
    transactions: Math.max(0, Math.trunc(finite(m.transactions))),
    cashStart,
    cashEnd,
    revenue: { ...m.revenue },
    expenses: { ...m.expenses },
    taxes,
    cashflow,
    products: (m.products ?? []).map(deriveProduct),

    totalRevenue,
    totalExpenses,
    vatDue,
    totalToState,
    grossProfit,
    netProfit,
    margin: safeDiv(netProfit, totalRevenue),
    avgTicket: safeDiv(totalRevenue, clients),
    revenuePerWorkingDay: safeDiv(totalRevenue, workingDays),
    cashChange: subtract(cashEnd, cashStart),
    computedCashEnd,
    cashDiscrepancy: subtract(cashEnd, computedCashEnd),
    expenseRatio: safeDiv(totalExpenses, totalRevenue),
    cashBufferMonths: safeDiv(cashEnd, monthlyBurn),
  };
}

/** Топ разходи по сума низходящо, с дял от оборота и от общите разходи. */
export function topExpenses(
  d: MonthDerived,
  s: CalcSettings,
  n = 5,
): RankedExpense[] {
  const names = new Map(s.expenseCategories.map((c) => [c.id, c.name]));
  return Object.entries(d.expenses)
    .map(([categoryId, amount]) => ({
      categoryId,
      name: names.get(categoryId) ?? categoryId,
      amount: finite(amount),
      shareOfRevenue: safeDiv(finite(amount), d.totalRevenue),
      shareOfExpenses: safeDiv(finite(amount), d.totalExpenses),
    }))
    .filter((e) => e.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, n);
}

/** Топ продукти по печалба низходящо. */
export function topProducts(products: ProductDerived[], n = 5): ProductDerived[] {
  return [...products]
    .filter((p) => p.quantity > 0)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, n);
}

/** Най-слаби продукти по печалба възходящо. */
export function worstProducts(products: ProductDerived[], n = 5): ProductDerived[] {
  return [...products]
    .filter((p) => p.quantity > 0)
    .sort((a, b) => a.profit - b.profit)
    .slice(0, n);
}
