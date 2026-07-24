import type { CalcSettings, MonthInput } from '../types';

export function makeSettings(overrides: Partial<CalcSettings> = {}): CalcSettings {
  return {
    targetProfit: 5000,
    minMargin: 0.3,
    minCashBuffer: 3000,
    targetClients: 200,
    revenueCategories: [
      { id: 'services', name: 'Услуги', active: true, order: 0 },
      { id: 'products', name: 'Продукти', active: true, order: 1 },
      { id: 'subscriptions', name: 'Абонаменти', active: true, order: 2 },
      { id: 'other_income', name: 'Други приходи', active: true, order: 3 },
    ],
    expenseCategories: [
      { id: 'rent', name: 'Наем', active: true, order: 0 },
      { id: 'salaries', name: 'Заплати', active: true, order: 1 },
      { id: 'materials', name: 'Материали', active: true, order: 2 },
      { id: 'marketing', name: 'Реклама и маркетинг', active: true, order: 3 },
      { id: 'other_expense', name: 'Други разходи', active: true, order: 4 },
    ],
    ...overrides,
  };
}

/** Известен месец с ръчно изчислени очаквани стойности (виж тестовете). */
export function makeKnownMonth(overrides: Partial<MonthInput> = {}): MonthInput {
  return {
    year: 2026,
    month: 6,
    workingDays: 22,
    clients: 210,
    transactions: 260,
    cashStart: 2000,
    cashEnd: 5200,
    revenue: { services: 8500, products: 1200 },
    expenses: { rent: 1200, salaries: 2600, materials: 800, marketing: 300 },
    taxes: {
      vatCharged: 1616.67,
      vatPaid: 816.67,
      ownerInsurance: 420,
      extraInsurance: 0,
      corpTax: 150,
      otherObligations: 0,
    },
    cashflow: {
      inCash: 5000,
      inBank: 4700,
      outCash: 2500,
      outBank: 3900,
      receivables: 350,
      payables: 0,
    },
    products: [
      { name: 'Подстрижка', price: 25, cost: 5, quantity: 100, durationMinutes: 30 },
      { name: 'Боядисване', price: 60, cost: 18, quantity: 30, durationMinutes: 90 },
      { name: 'Шампоан', price: 15, cost: 7, quantity: 40 },
    ],
    ...overrides,
  };
}

/** Изцяло празен месец — проверка, че нищо не гърми при нулев вход. */
export function makeEmptyMonth(overrides: Partial<MonthInput> = {}): MonthInput {
  return {
    year: 2026,
    month: 1,
    workingDays: 0,
    clients: 0,
    transactions: 0,
    cashStart: 0,
    cashEnd: 0,
    revenue: {},
    expenses: {},
    taxes: {},
    cashflow: {},
    products: [],
    ...overrides,
  };
}
