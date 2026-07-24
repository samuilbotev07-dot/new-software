'use client';

import { useState } from 'react';
import { computeMonth } from '@/lib/calc/month';
import type { MonthDerived } from '@/lib/calc/types';
import { monthRowToInput, settingsRowToCalc } from '@/lib/db/mappers';
import type { MonthRow, ProfileRow, SettingsRow } from '@/lib/db/types';
import { buildWorkbook } from '@/lib/excel/build';
import { bg } from '@/lib/i18n/bg';
import { createClient } from '@/lib/supabase/client';

/** Експорт на всички данни в Excel — достъпен от всеки екран. */
export function ExportExcelButton() {
  const [busy, setBusy] = useState(false);

  async function exportAll() {
    setBusy(true);
    try {
      const supabase = createClient();
      const [profileRes, settingsRes, monthsRes] = await Promise.all([
        supabase.from('profiles').select('*').maybeSingle(),
        supabase.from('settings').select('*').maybeSingle(),
        supabase
          .from('months')
          .select('*')
          .order('year', { ascending: true })
          .order('month', { ascending: true }),
      ]);

      const profile = (profileRes.data as ProfileRow | null) ?? null;
      const settingsRow = (settingsRes.data as SettingsRow | null) ?? null;
      const monthRows = ((monthsRes.data as MonthRow[] | null) ?? []).slice();

      const settings = settingsRow
        ? settingsRowToCalc(settingsRow)
        : {
            targetProfit: 0,
            minMargin: 0.3,
            minCashBuffer: 0,
            targetClients: 0,
            revenueCategories: [],
            expenseCategories: [],
          };

      const inputs = monthRows.map((r) => monthRowToInput(r, profile));
      const derived: MonthDerived[] = [];
      for (const input of inputs) {
        derived.push(computeMonth(input, settings, derived));
      }

      const wb = await buildWorkbook(profile, settingsRow, settings, inputs, derived);
      const XLSX = await import('xlsx');
      const today = new Date();
      const stamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      XLSX.writeFile(wb, `${bg.excel.fileName}-${stamp}.xlsx`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={exportAll}
      disabled={busy}
      className="rounded-sm border border-rule px-2 py-1 text-sm text-ink-soft hover:bg-rule/40 hover:text-ink disabled:opacity-50"
    >
      {busy ? bg.common.loading : bg.common.exportExcel}
    </button>
  );
}
