'use server';

import { z } from 'zod';
import { requireUserId } from '@/lib/auth/server';
import { pool } from '@/lib/db/pool';

const num = z.number().finite().catch(0);
const int = z.number().finite().int().catch(0);
const shortText = z.string().max(500).catch('');
const longText = z.string().max(10000).catch('');
const numMap = z.record(z.string().max(64), num).catch({});

const monthSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  workingDays: int,
  clients: int,
  transactions: int,
  cashStart: num,
  cashEnd: num,
  revenue: numMap,
  expenses: numMap,
  taxes: z
    .object({
      vatCharged: num.optional(),
      vatPaid: num.optional(),
      ownerInsurance: num.optional(),
      extraInsurance: num.optional(),
      corpTax: num.optional(),
      otherObligations: num.optional(),
    })
    .catch({}),
  cashflow: z
    .object({
      inCash: num.optional(),
      inBank: num.optional(),
      outCash: num.optional(),
      outBank: num.optional(),
      receivables: num.optional(),
      payables: num.optional(),
    })
    .catch({}),
  products: z
    .array(
      z.object({
        catalogId: z.string().max(64).optional(),
        name: z.string().max(200).catch(''),
        price: num,
        cost: num,
        quantity: num,
        durationMinutes: z.number().finite().nullable().optional().catch(null),
        note: z.string().max(1000).optional().catch(undefined),
      }),
    )
    .max(100)
    .catch([]),
  selfAnalysis: z.record(z.string().max(32), longText).catch({}),
  notes: longText.optional(),
});

export type SaveMonthInput = z.input<typeof monthSchema>;

export async function saveMonth(input: SaveMonthInput): Promise<{ ok: boolean }> {
  const userId = await requireUserId();
  const m = monthSchema.parse(input);
  await pool.query(
    `insert into months (user_id, year, month, working_days, clients, transactions,
       cash_start, cash_end, revenue, expenses, taxes, cashflow, products, self_analysis, notes, updated_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12::jsonb,$13::jsonb,$14::jsonb,$15, now())
     on conflict (user_id, year, month) do update set
       working_days = excluded.working_days,
       clients = excluded.clients,
       transactions = excluded.transactions,
       cash_start = excluded.cash_start,
       cash_end = excluded.cash_end,
       revenue = excluded.revenue,
       expenses = excluded.expenses,
       taxes = excluded.taxes,
       cashflow = excluded.cashflow,
       products = excluded.products,
       self_analysis = excluded.self_analysis,
       notes = excluded.notes,
       updated_at = now()`,
    [
      userId,
      m.year,
      m.month,
      m.workingDays,
      m.clients,
      m.transactions,
      m.cashStart,
      m.cashEnd,
      JSON.stringify(m.revenue),
      JSON.stringify(m.expenses),
      JSON.stringify(m.taxes),
      JSON.stringify(m.cashflow),
      JSON.stringify(m.products),
      JSON.stringify(m.selfAnalysis),
      m.notes ?? '',
    ],
  );
  return { ok: true };
}

const profileSchema = z.object({
  business_name: shortText,
  business_type: shortText,
  city: shortText,
  owner_name: shortText,
  employees: int,
  tax_regime: shortText,
  vat_registered: z.boolean().catch(false),
  business_start_date: z.string().max(10).catch(''),
  default_working_days: int,
});

export type ProfileInput = z.input<typeof profileSchema>;

export async function updateProfile(input: ProfileInput): Promise<{ ok: boolean }> {
  const userId = await requireUserId();
  const p = profileSchema.parse(input);
  await pool.query(
    `update profiles set business_name=$2, business_type=$3, city=$4, owner_name=$5,
       employees=$6, tax_regime=$7, vat_registered=$8, business_start_date=$9, default_working_days=$10
     where id = $1`,
    [
      userId,
      p.business_name,
      p.business_type,
      p.city,
      p.owner_name,
      p.employees,
      p.tax_regime,
      p.vat_registered,
      p.business_start_date || null,
      p.default_working_days,
    ],
  );
  return { ok: true };
}

const goalsSchema = z.object({
  target_profit: num,
  min_margin: num,
  min_cash_buffer: num,
  target_clients: int,
  goals_12m: longText,
  biggest_problem: longText,
  top3_priorities: longText,
});

export type GoalsInput = z.input<typeof goalsSchema>;

export async function updateGoals(input: GoalsInput): Promise<{ ok: boolean }> {
  const userId = await requireUserId();
  const g = goalsSchema.parse(input);
  await pool.query(
    `update settings set target_profit=$2, min_margin=$3, min_cash_buffer=$4, target_clients=$5,
       goals_12m=$6, biggest_problem=$7, top3_priorities=$8, updated_at=now()
     where user_id = $1`,
    [
      userId,
      g.target_profit,
      g.min_margin,
      g.min_cash_buffer,
      g.target_clients,
      g.goals_12m,
      g.biggest_problem,
      g.top3_priorities,
    ],
  );
  return { ok: true };
}

const categorySchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(100),
  active: z.boolean().catch(true),
  order: int,
});

export async function updateCategories(input: {
  revenue: unknown;
  expenses: unknown;
}): Promise<{ ok: boolean }> {
  const userId = await requireUserId();
  const revenue = z.array(categorySchema).max(10).parse(input.revenue);
  const expenses = z.array(categorySchema).max(25).parse(input.expenses);
  await pool.query(
    `update settings set revenue_categories=$2::jsonb, expense_categories=$3::jsonb, updated_at=now()
     where user_id = $1`,
    [userId, JSON.stringify(revenue), JSON.stringify(expenses)],
  );
  return { ok: true };
}

const catalogItemSchema = z.object({
  id: z.string().max(64).optional(),
  name: z.string().min(1).max(200),
  kind: shortText,
  default_price: num,
  default_cost: num,
  duration_minutes: z.number().finite().nullable().catch(null),
  active: z.boolean().catch(true),
});

export async function saveCatalog(input: {
  items: unknown;
  removedIds: unknown;
}): Promise<{ ok: boolean }> {
  const userId = await requireUserId();
  const items = z.array(catalogItemSchema).max(200).parse(input.items);
  const removedIds = z.array(z.string().uuid()).max(200).catch([]).parse(input.removedIds);

  const client = await pool.connect();
  try {
    await client.query('begin');
    if (removedIds.length > 0) {
      await client.query(
        'delete from product_catalog where user_id = $1 and id = any($2::uuid[])',
        [userId, removedIds],
      );
    }
    for (let i = 0; i < items.length; i++) {
      const it = items[i]!;
      if (it.id) {
        await client.query(
          `update product_catalog set name=$3, kind=$4, default_price=$5, default_cost=$6,
             duration_minutes=$7, active=$8, sort_order=$9
           where user_id = $1 and id = $2`,
          [
            userId,
            it.id,
            it.name,
            it.kind || 'Услуга',
            it.default_price,
            it.default_cost,
            it.duration_minutes,
            it.active,
            i,
          ],
        );
      } else {
        await client.query(
          `insert into product_catalog (user_id, name, kind, default_price, default_cost, duration_minutes, active, sort_order)
           values ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            userId,
            it.name,
            it.kind || 'Услуга',
            it.default_price,
            it.default_cost,
            it.duration_minutes,
            it.active,
            i,
          ],
        );
      }
    }
    await client.query('commit');
  } catch (e) {
    await client.query('rollback');
    throw e;
  } finally {
    client.release();
  }
  return { ok: true };
}

export async function completeOnboarding(): Promise<{ ok: boolean }> {
  const userId = await requireUserId();
  await pool.query('update profiles set onboarding_completed = true where id = $1', [userId]);
  return { ok: true };
}

/** Изтрива акаунта и всички данни завинаги (каскадно през "user"). */
export async function deleteAccount(): Promise<{ ok: boolean }> {
  const userId = await requireUserId();
  await pool.query('delete from "user" where id = $1', [userId]);
  return { ok: true };
}
