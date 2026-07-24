'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { CategoryDef } from '@/lib/calc/types';
import type { SettingsRow } from '@/lib/db/types';
import { bg } from '@/lib/i18n/bg';
import { createClient } from '@/lib/supabase/client';

const MAX_REVENUE = 10;
const MAX_EXPENSE = 25;

function CategoryList({
  items,
  onChange,
  max,
  addLabel,
  maxLabel,
}: {
  items: CategoryDef[];
  onChange: (items: CategoryDef[]) => void;
  max: number;
  addLabel: string;
  maxLabel: string;
}) {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  return (
    <div className="flex flex-col gap-2">
      {sorted.map((c) => (
        <div key={c.id} className="flex items-center gap-2">
          <input
            aria-label={bg.settings.categories.name}
            value={c.name}
            onChange={(e) =>
              onChange(items.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)))
            }
            className="min-h-10 w-full rounded-sm border border-rule bg-card px-2 py-1 text-sm"
          />
          <label className="flex shrink-0 items-center gap-1.5 text-xs text-ink-soft">
            <input
              type="checkbox"
              checked={c.active}
              onChange={(e) =>
                onChange(
                  items.map((x) => (x.id === c.id ? { ...x, active: e.target.checked } : x)),
                )
              }
              className="h-4 w-4 accent-ink"
            />
            {bg.settings.categories.active}
          </label>
        </div>
      ))}
      {items.length < max ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() =>
            onChange([
              ...items,
              {
                id: crypto.randomUUID(),
                name: '',
                active: true,
                order: items.length,
              },
            ])
          }
        >
          {addLabel}
        </Button>
      ) : (
        <p className="text-xs text-ink-soft">{maxLabel}</p>
      )}
    </div>
  );
}

export function CategoriesForm({ settings }: { settings: SettingsRow | null }) {
  const t = bg.settings.categories;
  const [revenue, setRevenue] = useState<CategoryDef[]>(settings?.revenue_categories ?? []);
  const [expenses, setExpenses] = useState<CategoryDef[]>(settings?.expense_categories ?? []);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  async function save() {
    setState('saving');
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return setState('error');
    const clean = (list: CategoryDef[]) =>
      list.filter((c) => c.name.trim().length > 0).map((c, i) => ({ ...c, order: i }));
    const { error } = await supabase
      .from('settings')
      .update({
        revenue_categories: clean(revenue),
        expense_categories: clean(expenses),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
    setState(error ? 'error' : 'saved');
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-ink-soft">{t.renameHint}</p>
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold">{t.revenue}</h3>
          <CategoryList
            items={revenue}
            onChange={setRevenue}
            max={MAX_REVENUE}
            addLabel={t.addRevenue}
            maxLabel={t.maxRevenue}
          />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">{t.expenses}</h3>
          <CategoryList
            items={expenses}
            onChange={setExpenses}
            max={MAX_EXPENSE}
            addLabel={t.addExpense}
            maxLabel={t.maxExpense}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={state === 'saving'}>
          {bg.common.save}
        </Button>
        {state === 'saved' ? <span className="text-sm text-ledger">{bg.common.saved}</span> : null}
        {state === 'error' ? (
          <span className="text-sm text-stamp">{bg.common.saveError}</span>
        ) : null}
      </div>
    </div>
  );
}
