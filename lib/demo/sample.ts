/** Примерни данни за демо режима: фиктивен салон „Мария" в Пловдив. */
import type { CalcSettings, MonthInput } from '@/lib/calc/types';

export const demoSettings: CalcSettings = {
  targetProfit: 3000,
  minMargin: 0.35,
  minCashBuffer: 5000,
  targetClients: 220,
  revenueCategories: [
    { id: 'services', name: 'Услуги', active: true, order: 0 },
    { id: 'products', name: 'Продукти', active: true, order: 1 },
    { id: 'subscriptions', name: 'Абонаменти', active: true, order: 2 },
    { id: 'other_income', name: 'Други приходи', active: true, order: 3 },
  ],
  expenseCategories: [
    { id: 'rent', name: 'Наем', active: true, order: 0 },
    { id: 'salaries', name: 'Заплати', active: true, order: 1 },
    { id: 'staff_insurance', name: 'Осигуровки на персонал', active: true, order: 2 },
    { id: 'materials', name: 'Материали', active: true, order: 3 },
    { id: 'electricity', name: 'Ток', active: true, order: 4 },
    { id: 'water', name: 'Вода', active: true, order: 5 },
    { id: 'marketing', name: 'Реклама и маркетинг', active: true, order: 6 },
    { id: 'accounting', name: 'Счетоводство', active: true, order: 7 },
    { id: 'software', name: 'Софтуери/Абонаменти', active: true, order: 8 },
    { id: 'bank_fees', name: 'Банкови такси', active: true, order: 9 },
  ],
};

export const demoMonth: MonthInput = {
  year: 2026,
  month: 6,
  workingDays: 24,
  clients: 236,
  transactions: 310,
  cashStart: 4200,
  cashEnd: 6350,
  revenue: {
    services: 7840,
    products: 960,
    subscriptions: 450,
  },
  expenses: {
    rent: 950,
    salaries: 2400,
    staff_insurance: 520,
    materials: 780,
    electricity: 145,
    water: 38,
    marketing: 260,
    accounting: 120,
    software: 55,
    bank_fees: 42,
  },
  taxes: {
    vatCharged: 1541.67,
    vatPaid: 372.5,
    ownerInsurance: 430,
    extraInsurance: 0,
    corpTax: 210,
    otherObligations: 0,
  },
  cashflow: {
    inCash: 5150,
    inBank: 4100,
    outCash: 2900,
    outBank: 4200,
    receivables: 180,
    payables: 340,
  },
  products: [
    {
      name: 'Дамско подстригване',
      price: 35,
      cost: 6,
      quantity: 92,
      durationMinutes: 45,
    },
    { name: 'Боядисване', price: 75, cost: 22, quantity: 41, durationMinutes: 100 },
    { name: 'Маникюр', price: 30, cost: 7, quantity: 68, durationMinutes: 50 },
    { name: 'Кератинова терапия', price: 90, cost: 35, quantity: 9, durationMinutes: 120 },
    { name: 'Шампоан за вкъщи', price: 18, cost: 9, quantity: 27 },
  ],
  selfAnalysis: {
    wentWell: 'Кератиновите терапии тръгнаха добре след поста в Инстаграм.',
    wentBad: 'Два дежурни съботни дни бяха слаби — много отменени часове.',
    biggestProblem: 'Отменените часове в последния момент.',
    toImprove: 'Ще пробвам SMS напомняне 24 часа преди часа.',
  },
  notes: 'Юни е силен месец заради баловете.',
};

/** Предходен месец за сравнение в демото. */
export const demoPrevMonth: MonthInput = {
  ...demoMonth,
  month: 5,
  clients: 214,
  revenue: { services: 7120, products: 830, subscriptions: 450 },
  cashStart: 3650,
  cashEnd: 4200,
  cashflow: {
    inCash: 4700,
    inBank: 3700,
    outCash: 2800,
    outBank: 5050,
    receivables: 120,
    payables: 300,
  },
  selfAnalysis: {},
  notes: '',
};
