import { bg } from '@/lib/i18n/bg';
import { safeDiv } from './money';
import type {
  CalcSettings,
  CategoryScore,
  HealthCategoryKey,
  HealthResult,
  HealthStatus,
  MonthDerived,
} from './types';

const WEIGHTS: Record<HealthCategoryKey, number> = {
  profit: 0.2,
  margin: 0.15,
  cashflow: 0.15,
  expenses: 0.1,
  clients: 0.1,
  pricing: 0.1,
  stability: 0.1,
  growth: 0.05,
  risk: 0.05,
};

interface RawScore {
  score: number | null;
  reason: string;
}

function scoreProfit(d: MonthDerived, s: CalcSettings): RawScore {
  if (s.targetProfit <= 0) {
    return { score: null, reason: bg.health.reasons.profitNoTarget };
  }
  const ratio = d.netProfit / s.targetProfit;
  let score: number;
  if (ratio >= 1) score = 100;
  else if (ratio >= 0.75) score = 80;
  else if (ratio >= 0.5) score = 60;
  else if (ratio >= 0.25) score = 40;
  else if (d.netProfit > 0) score = 20;
  else score = 0;
  return { score, reason: bg.health.reasons.profit(d.netProfit, s.targetProfit) };
}

function scoreMargin(d: MonthDerived, s: CalcSettings): RawScore {
  const min = s.minMargin;
  const m = d.margin;
  let score: number;
  if (m >= min + 0.1) score = 100;
  else if (m >= min) score = 80;
  else if (m >= min - 0.05) score = 60;
  else if (m >= min - 0.1) score = 40;
  else if (m >= 0) score = 20;
  else score = 0;
  return { score, reason: bg.health.reasons.margin(m, min) };
}

function scoreCashflow(d: MonthDerived): RawScore {
  const b = d.cashBufferMonths;
  let score: number;
  if (b >= 3) score = 100;
  else if (b >= 2) score = 80;
  else if (b >= 1) score = 60;
  else if (b >= 0.5) score = 40;
  else if (b > 0) score = 20;
  else score = 0;
  return { score, reason: bg.health.reasons.cashflow(b) };
}

function scoreExpenses(d: MonthDerived): RawScore {
  if (d.totalRevenue === 0) {
    if (d.totalExpenses === 0) {
      return { score: null, reason: bg.health.reasons.expensesNoData };
    }
    return { score: 0, reason: bg.health.reasons.expensesNoRevenue };
  }
  const r = d.expenseRatio;
  let score: number;
  if (r <= 0.6) score = 100;
  else if (r <= 0.7) score = 80;
  else if (r <= 0.8) score = 60;
  else if (r <= 0.9) score = 40;
  else if (r <= 1) score = 20;
  else score = 0;
  return { score, reason: bg.health.reasons.expenses(r) };
}

/** Възходяща тенденция: ръст на клиентите три поредни месеца (вкл. текущия). */
function clientsRising(d: MonthDerived, history: MonthDerived[]): boolean {
  const last = history.slice(-2);
  if (last.length < 2) return false;
  const [m2, m1] = last as [MonthDerived, MonthDerived];
  return m1.clients > m2.clients && d.clients > m1.clients;
}

function scoreClients(d: MonthDerived, history: MonthDerived[], s: CalcSettings): RawScore {
  if (s.targetClients <= 0) {
    return { score: null, reason: bg.health.reasons.clientsNoTarget };
  }
  const ratio = d.clients / s.targetClients;
  const rising = clientsRising(d, history);
  let score: number;
  if (ratio >= 1 && rising) score = 100;
  else if (ratio >= 1) score = 80;
  else if (ratio >= 0.8) score = 60;
  else if (ratio >= 0.6) score = 40;
  else if (ratio >= 0.4) score = 20;
  else score = 0;
  const reason = rising
    ? bg.health.reasons.clientsRising(d.clients, s.targetClients)
    : bg.health.reasons.clients(d.clients, s.targetClients);
  return { score, reason };
}

function scorePricing(d: MonthDerived, history: MonthDerived[]): RawScore {
  const usable = history.slice(-6).filter((h) => h.avgTicket > 0);
  if (usable.length < 3 || d.avgTicket <= 0) {
    return { score: null, reason: bg.health.needMoreData };
  }
  const avg = usable.reduce((acc, h) => acc + h.avgTicket, 0) / usable.length;
  const change = safeDiv(d.avgTicket - avg, avg);
  let score: number;
  if (change >= 0.05) score = 100;
  else if (change >= -0.02) score = 80;
  else if (change >= -0.05) score = 60;
  else if (change >= -0.1) score = 40;
  else score = 20;
  return { score, reason: bg.health.reasons.pricing(d.avgTicket, avg) };
}

function scoreStability(d: MonthDerived, history: MonthDerived[]): RawScore {
  const revenues = [...history.slice(-5), d]
    .map((h) => h.totalRevenue)
    .filter((r) => r > 0);
  if (revenues.length < 3) {
    return { score: null, reason: bg.health.needMoreData };
  }
  const mean = revenues.reduce((a, b) => a + b, 0) / revenues.length;
  const variance =
    revenues.reduce((acc, r) => acc + (r - mean) ** 2, 0) / revenues.length;
  const cv = safeDiv(Math.sqrt(variance), mean);
  let score: number;
  if (cv < 0.1) score = 100;
  else if (cv < 0.2) score = 80;
  else if (cv < 0.3) score = 60;
  else if (cv < 0.4) score = 40;
  else score = 20;
  return { score, reason: bg.health.reasons.stability(cv) };
}

function scoreGrowth(d: MonthDerived, history: MonthDerived[]): RawScore {
  const yoy = history.find((h) => h.year === d.year - 1 && h.month === d.month);
  if (!yoy || yoy.totalRevenue <= 0) {
    return { score: null, reason: bg.health.needMoreData };
  }
  const change = safeDiv(d.totalRevenue - yoy.totalRevenue, yoy.totalRevenue);
  let score: number;
  if (change >= 0.15) score = 100;
  else if (change >= 0.05) score = 80;
  else if (change >= -0.05) score = 60;
  else if (change >= -0.15) score = 40;
  else score = 20;
  return { score, reason: bg.health.reasons.growth(change) };
}

function scoreRisk(d: MonthDerived, s: CalcSettings): RawScore {
  let score = 100;
  const reasons: string[] = [];

  if (d.totalRevenue > 0) {
    const top = [...d.products].sort((a, b) => b.revenue - a.revenue)[0];
    if (top) {
      const share = safeDiv(top.revenue, d.totalRevenue);
      if (share > 0.4) {
        score -= 20;
        reasons.push(bg.health.reasons.riskTopProduct(share));
      }
    }

    const revenueEntries = Object.entries(d.revenue).filter(([, v]) => v > 0);
    if (revenueEntries.length >= 2) {
      const names = new Map(s.revenueCategories.map((c) => [c.id, c.name]));
      for (const [id, amount] of revenueEntries) {
        const share = safeDiv(amount, d.totalRevenue);
        if (share > 0.6) {
          score -= 20;
          reasons.push(bg.health.reasons.riskRevenueCat(names.get(id) ?? id, share));
          break;
        }
      }
    }
  }

  if (d.totalExpenses > 0) {
    const expenseEntries = Object.entries(d.expenses).filter(([, v]) => v > 0);
    if (expenseEntries.length >= 2) {
      const names = new Map(s.expenseCategories.map((c) => [c.id, c.name]));
      for (const [id, amount] of expenseEntries) {
        const share = safeDiv(amount, d.totalExpenses);
        if (share > 0.35) {
          score -= 10;
          reasons.push(bg.health.reasons.riskExpenseCat(names.get(id) ?? id, share));
          break;
        }
      }
    }
  }

  score = Math.max(0, score);
  const reason = reasons.length > 0 ? reasons.join(' ') : bg.health.reasons.riskClean;
  return { score, reason };
}

const STATUS_BOUNDS: Array<[number, HealthStatus]> = [
  [80, 'stable'],
  [60, 'good'],
  [40, 'needs_work'],
  [0, 'high_risk'],
];

export function statusFor(total: number): HealthStatus {
  for (const [min, status] of STATUS_BOUNDS) {
    if (total >= min) return status;
  }
  return 'high_risk';
}

/**
 * Обща оценка на здравето 0–100.
 * @param history Предходни месеци, възходящо по време (без текущия).
 *
 * Категория без данни е null и НЕ участва — теглата се пренормират
 * върху наличните категории, така че сборът им винаги е 1.
 */
export function computeHealth(
  current: MonthDerived,
  history: MonthDerived[],
  s: CalcSettings,
): HealthResult {
  const raw: Array<{ key: HealthCategoryKey; r: RawScore }> = [
    { key: 'profit', r: scoreProfit(current, s) },
    { key: 'margin', r: scoreMargin(current, s) },
    { key: 'cashflow', r: scoreCashflow(current) },
    { key: 'expenses', r: scoreExpenses(current) },
    { key: 'clients', r: scoreClients(current, history, s) },
    { key: 'pricing', r: scorePricing(current, history) },
    { key: 'stability', r: scoreStability(current, history) },
    { key: 'growth', r: scoreGrowth(current, history) },
    { key: 'risk', r: scoreRisk(current, s) },
  ];

  const availableWeight = raw.reduce(
    (acc, { key, r }) => (r.score != null ? acc + WEIGHTS[key] : acc),
    0,
  );

  const categories: CategoryScore[] = raw.map(({ key, r }) => {
    const weight = WEIGHTS[key];
    const normalized = r.score != null ? safeDiv(weight, availableWeight) : 0;
    return {
      key,
      label: bg.health.labels[key],
      score: r.score,
      weight,
      contribution: r.score != null ? r.score * normalized : 0,
      reason: r.reason,
    };
  });

  const total = Math.round(
    categories.reduce((acc, c) => acc + c.contribution, 0),
  );
  const bounded = Math.max(0, Math.min(100, total));

  return { total: bounded, status: statusFor(bounded), categories };
}
