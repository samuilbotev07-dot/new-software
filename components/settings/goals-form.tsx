'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { NumberField, TextAreaField } from '@/components/ui/field';
import type { SettingsRow } from '@/lib/db/types';
import { bg } from '@/lib/i18n/bg';
import { createClient } from '@/lib/supabase/client';

export function GoalsForm({ settings }: { settings: SettingsRow | null }) {
  const t = bg.settings.goals;
  const [form, setForm] = useState({
    target_profit: Number(settings?.target_profit ?? 0),
    min_margin_pct: Number(settings?.min_margin ?? 0.3) * 100,
    min_cash_buffer: Number(settings?.min_cash_buffer ?? 0),
    target_clients: Number(settings?.target_clients ?? 0),
    goals_12m: settings?.goals_12m ?? '',
    biggest_problem: settings?.biggest_problem ?? '',
    top3_priorities: settings?.top3_priorities ?? '',
  });
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  async function save() {
    setState('saving');
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return setState('error');
    const { error } = await supabase
      .from('settings')
      .update({
        target_profit: form.target_profit,
        min_margin: form.min_margin_pct / 100,
        min_cash_buffer: form.min_cash_buffer,
        target_clients: form.target_clients,
        goals_12m: form.goals_12m,
        biggest_problem: form.biggest_problem,
        top3_priorities: form.top3_priorities,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
    setState(error ? 'error' : 'saved');
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label={t.targetProfit}
          value={form.target_profit}
          onChange={(v) => setForm((f) => ({ ...f, target_profit: v }))}
          suffix="€"
        />
        <NumberField
          label={t.minMargin}
          value={form.min_margin_pct}
          onChange={(v) => setForm((f) => ({ ...f, min_margin_pct: v }))}
          suffix="%"
        />
        <NumberField
          label={t.minCashBuffer}
          value={form.min_cash_buffer}
          onChange={(v) => setForm((f) => ({ ...f, min_cash_buffer: v }))}
          suffix="€"
        />
        <NumberField
          label={t.targetClients}
          value={form.target_clients}
          onChange={(v) => setForm((f) => ({ ...f, target_clients: v }))}
          integer
        />
      </div>
      <TextAreaField
        label={t.goals12m}
        value={form.goals_12m}
        onChange={(v) => setForm((f) => ({ ...f, goals_12m: v }))}
      />
      <TextAreaField
        label={t.biggestProblem}
        value={form.biggest_problem}
        onChange={(v) => setForm((f) => ({ ...f, biggest_problem: v }))}
      />
      <TextAreaField
        label={t.top3Priorities}
        value={form.top3_priorities}
        onChange={(v) => setForm((f) => ({ ...f, top3_priorities: v }))}
      />
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
