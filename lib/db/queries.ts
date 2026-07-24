/** Достъп до данните от сървърни компоненти. Само четене/писане — без сметки. */
import 'server-only';
import { computeMonth } from '@/lib/calc/month';
import type { CalcSettings, MonthDerived } from '@/lib/calc/types';
import { createClient } from '@/lib/supabase/server';
import { monthRowToInput, settingsRowToCalc } from './mappers';
import type { CatalogRow, MonthRow, ProfileRow, SettingsRow } from './types';

export async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('*').maybeSingle();
  return (data as ProfileRow | null) ?? null;
}

export async function getSettingsRow(): Promise<SettingsRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('settings').select('*').maybeSingle();
  return (data as SettingsRow | null) ?? null;
}

export async function listCatalog(): Promise<CatalogRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('product_catalog')
    .select('*')
    .order('sort_order', { ascending: true });
  return (data as CatalogRow[] | null) ?? [];
}

/** Всички месеци, възходящо по време. */
export async function listMonthRows(): Promise<MonthRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('months')
    .select('*')
    .order('year', { ascending: true })
    .order('month', { ascending: true });
  return (data as MonthRow[] | null) ?? [];
}

export async function getMonthRow(year: number, month: number): Promise<MonthRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('months')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .maybeSingle();
  return (data as MonthRow | null) ?? null;
}

export interface AppContext {
  profile: ProfileRow | null;
  settingsRow: SettingsRow | null;
  settings: CalcSettings;
  /** Всички месеци, производни, възходящо по време. */
  derived: MonthDerived[];
}

const EMPTY_SETTINGS: CalcSettings = {
  targetProfit: 0,
  minMargin: 0.3,
  minCashBuffer: 0,
  targetClients: 0,
  revenueCategories: [],
  expenseCategories: [],
};

/** Зарежда всичко и изчислява производните на всички месеци поред. */
export async function loadAppContext(): Promise<AppContext> {
  const [profile, settingsRow, monthRows] = await Promise.all([
    getProfile(),
    getSettingsRow(),
    listMonthRows(),
  ]);
  const settings = settingsRow ? settingsRowToCalc(settingsRow) : EMPTY_SETTINGS;

  const derived: MonthDerived[] = [];
  for (const row of monthRows) {
    derived.push(computeMonth(monthRowToInput(row, profile), settings, derived));
  }

  return { profile, settingsRow, settings, derived };
}

/** Помощници върху списъка производни месеци. */
export function findMonth(
  derived: MonthDerived[],
  year: number,
  month: number,
): MonthDerived | null {
  return derived.find((d) => d.year === year && d.month === month) ?? null;
}

export function prevOf(
  derived: MonthDerived[],
  year: number,
  month: number,
): MonthDerived | null {
  const py = month === 1 ? year - 1 : year;
  const pm = month === 1 ? 12 : month - 1;
  return findMonth(derived, py, pm);
}

export function yoyOf(
  derived: MonthDerived[],
  year: number,
  month: number,
): MonthDerived | null {
  return findMonth(derived, year - 1, month);
}

/** Историята преди даден месец (за здравето). */
export function historyBefore(
  derived: MonthDerived[],
  year: number,
  month: number,
): MonthDerived[] {
  return derived.filter((d) => d.year < year || (d.year === year && d.month < month));
}
