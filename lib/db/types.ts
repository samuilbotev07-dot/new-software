/** Редовете в базата — каквото пази Supabase. Приложението смята, базата пази. */
import type {
  CashflowInput,
  CategoryDef,
  ProductInput,
  SelfAnalysis,
  TaxesInput,
} from '@/lib/calc/types';

export interface ProfileRow {
  id: string;
  business_name: string | null;
  business_type: string | null;
  city: string | null;
  owner_name: string | null;
  employees: number | null;
  tax_regime: string | null;
  vat_registered: boolean | null;
  business_start_date: string | null;
  default_working_days: number | null;
  onboarding_completed: boolean | null;
  created_at: string;
}

export interface SettingsRow {
  user_id: string;
  target_profit: number;
  min_margin: number;
  min_cash_buffer: number;
  target_clients: number;
  revenue_categories: CategoryDef[];
  expense_categories: CategoryDef[];
  goals_12m: string | null;
  biggest_problem: string | null;
  top3_priorities: string | null;
  updated_at: string;
}

export interface CatalogRow {
  id: string;
  user_id: string;
  name: string;
  kind: string;
  default_price: number;
  default_cost: number;
  duration_minutes: number | null;
  active: boolean;
  sort_order: number;
}

export interface MonthRow {
  id: string;
  user_id: string;
  year: number;
  month: number;
  working_days: number | null;
  clients: number | null;
  transactions: number | null;
  cash_start: number | null;
  cash_end: number | null;
  revenue: Record<string, number>;
  expenses: Record<string, number>;
  taxes: TaxesInput;
  cashflow: CashflowInput;
  products: ProductInput[];
  self_analysis: SelfAnalysis;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
