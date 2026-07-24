import { notFound } from 'next/navigation';
import { MonthEntryForm } from '@/components/month-entry/month-entry-form';
import { monthRowToInput } from '@/lib/db/mappers';
import {
  getMonthRow,
  getProfile,
  getSettingsRow,
  listCatalog,
} from '@/lib/db/queries';
import { settingsRowToCalc } from '@/lib/db/mappers';
import type { MonthInput } from '@/lib/calc/types';

export default async function MonthEntryPage({
  params,
}: {
  params: Promise<{ year: string; month: string }>;
}) {
  const { year: yearStr, month: monthStr } = await params;
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    year < 2000 ||
    year > 2100 ||
    month < 1 ||
    month > 12
  ) {
    notFound();
  }

  const [row, profile, settingsRow, catalog] = await Promise.all([
    getMonthRow(year, month),
    getProfile(),
    getSettingsRow(),
    listCatalog(),
  ]);

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

  const initial: MonthInput = row
    ? monthRowToInput(row, profile)
    : {
        year,
        month,
        workingDays: profile?.default_working_days ?? 22,
        clients: 0,
        transactions: 0,
        cashStart: 0,
        cashEnd: 0,
        revenue: {},
        expenses: {},
        taxes: {},
        cashflow: {},
        products: [],
        selfAnalysis: {},
        notes: '',
      };

  return (
    <MonthEntryForm
      initial={initial}
      settings={settings}
      catalog={catalog.filter((c) => c.active)}
      exists={row != null}
    />
  );
}
