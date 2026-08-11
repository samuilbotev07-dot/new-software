'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { NumberField } from '@/components/ui/field';
import { useRouter } from 'next/navigation';
import type { CatalogRow } from '@/lib/db/types';
import { bg } from '@/lib/i18n/bg';
import { saveCatalog } from '@/app/actions';

interface EditableItem {
  id?: string;
  name: string;
  kind: string;
  default_price: number;
  default_cost: number;
  duration_minutes: number | null;
  active: boolean;
  sort_order: number;
}

export function CatalogForm({ catalog }: { catalog: CatalogRow[] }) {
  const t = bg.settings.catalog;
  const [items, setItems] = useState<EditableItem[]>(
    catalog.map((c) => ({
      id: c.id,
      name: c.name,
      kind: c.kind,
      default_price: Number(c.default_price),
      default_cost: Number(c.default_cost),
      duration_minutes: c.duration_minutes,
      active: c.active,
      sort_order: c.sort_order,
    })),
  );
  const router = useRouter();
  const [removed, setRemoved] = useState<string[]>([]);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const update = (i: number, patch: Partial<EditableItem>) =>
    setItems((prev) => prev.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  async function save() {
    setState('saving');
    const valid = items
      .filter((x) => x.name.trim().length > 0)
      .map((x) => ({
        id: x.id,
        name: x.name.trim(),
        kind: x.kind || 'Услуга',
        default_price: x.default_price,
        default_cost: x.default_cost,
        duration_minutes: x.duration_minutes,
        active: x.active,
      }));
    try {
      await saveCatalog({ items: valid, removedIds: removed });
      setRemoved([]);
      setState('saved');
      router.refresh();
    } catch {
      setState('error');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 ? <p className="text-sm text-ink-soft">{t.empty}</p> : null}
      <ul className="flex flex-col gap-3">
        {items.map((item, i) => (
          <li key={item.id ?? `new-${i}`} className="rounded-sm border border-rule p-3">
            <div className="mb-2 flex items-center gap-2">
              <input
                aria-label={t.name}
                value={item.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder={t.name}
                className="min-h-10 w-full rounded-sm border border-rule bg-card px-2 py-1 text-sm font-medium"
              />
              <select
                aria-label={t.kind}
                value={item.kind}
                onChange={(e) => update(i, { kind: e.target.value })}
                className="min-h-10 shrink-0 rounded-sm border border-rule bg-card px-2 py-1 text-sm"
              >
                {t.kinds.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-label={bg.common.delete}
                onClick={() => {
                  if (item.id) setRemoved((prev) => [...prev, item.id!]);
                  setItems((prev) => prev.filter((_, j) => j !== i));
                }}
                className="shrink-0 rounded-sm border border-rule px-2 py-1 text-sm text-stamp hover:bg-stamp-soft"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <NumberField
                label={t.price}
                value={item.default_price}
                onChange={(v) => update(i, { default_price: v })}
                suffix="€"
              />
              <NumberField
                label={t.cost}
                value={item.default_cost}
                onChange={(v) => update(i, { default_cost: v })}
                suffix="€"
              />
              <NumberField
                label={t.duration}
                value={item.duration_minutes ?? 0}
                onChange={(v) => update(i, { duration_minutes: v > 0 ? v : null })}
                integer
              />
            </div>
            <label className="mt-2 flex items-center gap-1.5 text-xs text-ink-soft">
              <input
                type="checkbox"
                checked={item.active}
                onChange={(e) => update(i, { active: e.target.checked })}
                className="h-4 w-4 accent-ink"
              />
              {t.active}
            </label>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="ghost"
        onClick={() =>
          setItems((prev) => [
            ...prev,
            {
              name: '',
              kind: 'Услуга',
              default_price: 0,
              default_cost: 0,
              duration_minutes: null,
              active: true,
              sort_order: prev.length,
            },
          ])
        }
      >
        {t.add}
      </Button>
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
