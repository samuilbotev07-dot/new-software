'use client';

import { useState } from 'react';
import { BusinessForm } from './business-form';
import { CatalogForm } from './catalog-form';
import { CategoriesForm } from './categories-form';
import { DataPanel } from './data-panel';
import { GoalsForm } from './goals-form';
import type { CatalogRow, ProfileRow, SettingsRow } from '@/lib/db/types';
import { bg } from '@/lib/i18n/bg';

type Tab = 'business' | 'goals' | 'categories' | 'catalog' | 'data';

const TABS: Tab[] = ['business', 'goals', 'categories', 'catalog', 'data'];

export function SettingsTabs({
  profile,
  settings,
  catalog,
}: {
  profile: ProfileRow | null;
  settings: SettingsRow | null;
  catalog: CatalogRow[];
}) {
  const [tab, setTab] = useState<Tab>('business');

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-rule">
        {TABS.map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm ${
              tab === key
                ? 'border-ink font-semibold text-ink'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {bg.settings.tabs[key]}
          </button>
        ))}
      </div>
      <div className="rounded-sm border border-rule bg-card p-4">
        {tab === 'business' ? <BusinessForm profile={profile} /> : null}
        {tab === 'goals' ? <GoalsForm settings={settings} /> : null}
        {tab === 'categories' ? <CategoriesForm settings={settings} /> : null}
        {tab === 'catalog' ? <CatalogForm catalog={catalog} /> : null}
        {tab === 'data' ? <DataPanel /> : null}
      </div>
    </div>
  );
}
