'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { NumberField, SelectField, TextField } from '@/components/ui/field';
import type { ProfileRow } from '@/lib/db/types';
import { bg } from '@/lib/i18n/bg';
import { createClient } from '@/lib/supabase/client';

export function BusinessForm({ profile }: { profile: ProfileRow | null }) {
  const t = bg.settings.business;
  const [form, setForm] = useState({
    business_name: profile?.business_name ?? '',
    business_type: profile?.business_type ?? '',
    city: profile?.city ?? '',
    owner_name: profile?.owner_name ?? '',
    employees: profile?.employees ?? 1,
    tax_regime: profile?.tax_regime ?? '',
    vat_registered: profile?.vat_registered ?? false,
    business_start_date: profile?.business_start_date ?? '',
    default_working_days: profile?.default_working_days ?? 22,
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
      .from('profiles')
      .update({
        ...form,
        business_start_date: form.business_start_date || null,
      })
      .eq('id', user.id);
    setState(error ? 'error' : 'saved');
  }

  return (
    <div className="flex flex-col gap-3">
      <TextField
        label={t.businessName}
        value={form.business_name}
        onChange={(v) => setForm((f) => ({ ...f, business_name: v }))}
      />
      <SelectField
        label={t.businessType}
        value={form.business_type}
        onChange={(v) => setForm((f) => ({ ...f, business_type: v }))}
        options={t.types}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label={t.city}
          value={form.city}
          onChange={(v) => setForm((f) => ({ ...f, city: v }))}
        />
        <TextField
          label={t.ownerName}
          value={form.owner_name}
          onChange={(v) => setForm((f) => ({ ...f, owner_name: v }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label={t.employees}
          value={form.employees}
          onChange={(v) => setForm((f) => ({ ...f, employees: v }))}
          integer
        />
        <NumberField
          label={t.defaultWorkingDays}
          value={form.default_working_days}
          onChange={(v) => setForm((f) => ({ ...f, default_working_days: v }))}
          integer
        />
      </div>
      <SelectField
        label={t.taxRegime}
        value={form.tax_regime}
        onChange={(v) => setForm((f) => ({ ...f, tax_regime: v }))}
        options={t.taxRegimes}
      />
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.vat_registered}
          onChange={(e) => setForm((f) => ({ ...f, vat_registered: e.target.checked }))}
          className="h-4 w-4 accent-ink"
        />
        {t.vatRegistered}
      </label>
      <TextField
        label={t.businessStartDate}
        value={form.business_start_date}
        onChange={(v) => setForm((f) => ({ ...f, business_start_date: v }))}
        type="date"
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
