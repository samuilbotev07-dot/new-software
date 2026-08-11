import 'server-only';
import { pool } from '@/lib/db/pool';

/**
 * Стандартните категории при нов акаунт. Пазени по фиксирани id-та —
 * преименуването не губи история, а предупрежденията за наем/заплати
 * работят независимо от името.
 */
const DEFAULT_REVENUE = [
  { id: 'services', name: 'Услуги', active: true, order: 0 },
  { id: 'products', name: 'Продукти', active: true, order: 1 },
  { id: 'subscriptions', name: 'Абонаменти', active: true, order: 2 },
  { id: 'other_income', name: 'Други приходи', active: true, order: 3 },
];

const DEFAULT_EXPENSES = [
  { id: 'rent', name: 'Наем', active: true, order: 0 },
  { id: 'salaries', name: 'Заплати', active: true, order: 1 },
  { id: 'staff_insurance', name: 'Осигуровки на персонал', active: true, order: 2 },
  { id: 'materials', name: 'Материали', active: true, order: 3 },
  { id: 'consumables', name: 'Консумативи', active: true, order: 4 },
  { id: 'electricity', name: 'Ток', active: true, order: 5 },
  { id: 'water', name: 'Вода', active: true, order: 6 },
  { id: 'heating', name: 'Отопление/Газ', active: true, order: 7 },
  { id: 'transport', name: 'Транспорт/Гориво', active: true, order: 8 },
  { id: 'marketing', name: 'Реклама и маркетинг', active: true, order: 9 },
  { id: 'accounting', name: 'Счетоводство', active: true, order: 10 },
  { id: 'software', name: 'Софтуери/Абонаменти', active: true, order: 11 },
  { id: 'repairs', name: 'Ремонти и поддръжка', active: true, order: 12 },
  { id: 'commissions', name: 'Комисиони', active: true, order: 13 },
  { id: 'bank_fees', name: 'Банкови такси', active: true, order: 14 },
  { id: 'other_expense', name: 'Други разходи', active: true, order: 15 },
];

/** При регистрация: профил + настройки със стандартните категории. */
export async function createDefaultRows(userId: string): Promise<void> {
  await pool.query(
    `insert into profiles (id) values ($1) on conflict (id) do nothing`,
    [userId],
  );
  await pool.query(
    `insert into settings (user_id, revenue_categories, expense_categories)
     values ($1, $2::jsonb, $3::jsonb)
     on conflict (user_id) do nothing`,
    [userId, JSON.stringify(DEFAULT_REVENUE), JSON.stringify(DEFAULT_EXPENSES)],
  );
}
