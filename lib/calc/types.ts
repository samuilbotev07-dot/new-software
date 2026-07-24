/** Домейн типове на калкулационния енджин. Чисти данни, без зависимости. */

export interface CategoryDef {
  id: string;
  name: string;
  active: boolean;
  order: number;
}

/** Настройки на потребителя, нужни на калкулациите. */
export interface CalcSettings {
  /** Целева месечна нетна печалба (€). 0 = не е зададена. */
  targetProfit: number;
  /** Минимален приемлив марж, 0..1. */
  minMargin: number;
  /** Минимален кеш буфер (€). 0 = не е зададен. */
  minCashBuffer: number;
  /** Целеви брой клиенти на месец. 0 = не е зададен. */
  targetClients: number;
  revenueCategories: CategoryDef[];
  expenseCategories: CategoryDef[];
}

export interface TaxesInput {
  vatCharged?: number;
  vatPaid?: number;
  ownerInsurance?: number;
  extraInsurance?: number;
  corpTax?: number;
  otherObligations?: number;
}

export interface CashflowInput {
  inCash?: number;
  inBank?: number;
  outCash?: number;
  outBank?: number;
  receivables?: number;
  payables?: number;
}

export interface ProductInput {
  catalogId?: string;
  name: string;
  price: number;
  cost: number;
  quantity: number;
  durationMinutes?: number | null;
  note?: string;
}

export interface SelfAnalysis {
  wentWell?: string;
  wentBad?: string;
  biggestProblem?: string;
  bestProduct?: string;
  worstProduct?: string;
  toImprove?: string;
  decisions?: string;
  questions?: string;
}

/** Входните данни на един месец — това, което потребителят е въвел. */
export interface MonthInput {
  year: number;
  month: number; // 1..12
  workingDays: number;
  clients: number;
  transactions: number;
  cashStart: number;
  cashEnd: number;
  revenue: Record<string, number>;
  expenses: Record<string, number>;
  taxes: TaxesInput;
  cashflow: CashflowInput;
  products: ProductInput[];
  selfAnalysis?: SelfAnalysis;
  notes?: string;
}

export interface ProductDerived extends ProductInput {
  revenue: number;
  totalCost: number;
  profit: number;
  /** 0..1; 0 при нулев приход. */
  margin: number;
  /** null когато няма въведено времетраене — UI показва „—". */
  profitPerHour: number | null;
}

/** Производните числа на един месец. */
export interface MonthDerived {
  year: number;
  month: number;
  workingDays: number;
  clients: number;
  transactions: number;
  cashStart: number;
  cashEnd: number;
  revenue: Record<string, number>;
  expenses: Record<string, number>;
  taxes: Required<TaxesInput>;
  cashflow: Required<CashflowInput>;
  products: ProductDerived[];

  totalRevenue: number;
  totalExpenses: number;
  vatDue: number;
  totalToState: number;
  grossProfit: number;
  netProfit: number;
  /** 0..1 (може да е отрицателен при загуба). 0 при нулев оборот. */
  margin: number;
  avgTicket: number;
  revenuePerWorkingDay: number;
  cashChange: number;
  computedCashEnd: number;
  cashDiscrepancy: number;
  expenseRatio: number;
  /** Месеци кеш буфер спрямо средния месечен разход (разходи + държава). */
  cashBufferMonths: number;
}

export interface RankedExpense {
  categoryId: string;
  name: string;
  amount: number;
  /** Дял от оборота, 0..1. */
  shareOfRevenue: number;
  /** Дял от общите разходи, 0..1. */
  shareOfExpenses: number;
}

export type HealthStatus = 'stable' | 'good' | 'needs_work' | 'high_risk';

export type HealthCategoryKey =
  | 'profit'
  | 'margin'
  | 'cashflow'
  | 'expenses'
  | 'clients'
  | 'pricing'
  | 'stability'
  | 'growth'
  | 'risk';

export interface CategoryScore {
  key: HealthCategoryKey;
  label: string;
  /** 0–100 или null при недостатъчно данни / незададена цел. */
  score: number | null;
  /** Оригиналното тегло от спецификацията, 0..1. */
  weight: number;
  /** Реален принос към общия резултат след пренормиране (точки). */
  contribution: number;
  /** Едно изречение на български с реалните числа. */
  reason: string;
}

export interface HealthResult {
  total: number;
  status: HealthStatus;
  categories: CategoryScore[];
}

export type WarningSeverity = 'critical' | 'warning' | 'info';

export interface Warning {
  severity: WarningSeverity;
  text: string;
  action?: string;
}
