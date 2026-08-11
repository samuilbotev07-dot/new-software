/**
 * Достъп до данните от сървъра. Всяка заявка е ограничена до текущия
 * потребител от сесията — това е границата на изолация между акаунти.
 * Само четене/писане — без сметки (те живеят в lib/calc/).
 */
import 'server-only';
import { computeMonth } from '@/lib/calc/month';
import type { CalcSettings, MonthDerived } from '@/lib/calc/types';
import { getUserId } from '@/lib/auth/server';
import { pool } from './pool';
import { monthRowToInput, settingsRowToCalc } from './mappers';
import type { CatalogRow, MonthRow, ProfileRow, SettingsRow } from './types';

export async function getProfile(): Promise<ProfileRow | null> {
  const userId = await getUserId();
  if (!userId) return null;
  const { rows } = await pool.query(
    'select *, business_start_date::text as business_start_date from profiles where id = $1',
    [userId],
  );
  return (rows[0] as ProfileRow | undefined) ?? null;
}

export async function getSettingsRow(): Promise<SettingsRow | null> {
  const userId = await getUserId();
  if (!userId) return null;
  const { rows } = await pool.query('select * from settings where user_id = $1', [userId]);
  return (rows[0] as SettingsRow | undefined) ?? null;
}

export async function listCatalog(): Promise<CatalogRow[]> {
  const userId = await getUserId();
  if (!userId) return [];
  const { rows } = await pool.query(
    'select * from product_catalog where user_id = $1 order by sort_order asc',
    [userId],
  );
  return rows as CatalogRow[];
}

/** Всички месеци, възходящо по време. */
export async function listMonthRows(): Promise<MonthRow[]> {
  const userId = await getUserId();
  if (!userId) return [];
  const { rows } = await pool.query(
    'select * from months where user_id = $1 order by year asc, month asc',
    [userId],
  );
  return rows as MonthRow[];
}

export async function getMonthRow(year: number, month: number): Promise<MonthRow | null> {
  const userId = await getUserId();
  if (!userId) return null;
  const { rows } = await pool.query(
    'select * from months where user_id = $1 and year = $2 and month = $3',
    [userId, year, month],
  );
  return (rows[0] as MonthRow | undefined) ?? null;
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
