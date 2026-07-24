'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BusinessForm } from '@/components/settings/business-form';
import { CatalogForm } from '@/components/settings/catalog-form';
import { CategoriesForm } from '@/components/settings/categories-form';
import { GoalsForm } from '@/components/settings/goals-form';
import { Button } from '@/components/ui/button';
import type { CatalogRow, ProfileRow, SettingsRow } from '@/lib/db/types';
import { bg } from '@/lib/i18n/bg';
import { createClient } from '@/lib/supabase/client';

const STEPS = ['business', 'goals', 'categories', 'catalog'] as const;
type Step = (typeof STEPS)[number];

const INTROS: Record<Step, string> = {
  business: bg.onboarding.businessIntro,
  goals: bg.onboarding.goalsIntro,
  categories: bg.onboarding.categoriesIntro,
  catalog: bg.onboarding.catalogIntro,
};

export function OnboardingWizard({
  profile,
  settings,
  catalog,
}: {
  profile: ProfileRow | null;
  settings: SettingsRow | null;
  catalog: CatalogRow[];
}) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const step = STEPS[stepIndex]!;

  async function finish() {
    setBusy(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id);
    }
    router.push('/');
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <ol className="flex gap-1">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <button
              type="button"
              onClick={() => setStepIndex(i)}
              aria-current={i === stepIndex ? 'step' : undefined}
              className={`w-full rounded-sm border px-2 py-1.5 text-xs ${
                i === stepIndex
                  ? 'border-ink bg-ink text-paper'
                  : i < stepIndex
                    ? 'border-ledger bg-ledger-soft text-ledger'
                    : 'border-rule text-ink-soft'
              }`}
            >
              {i + 1}. {bg.onboarding.steps[s]}
            </button>
          </li>
        ))}
      </ol>

      <p className="text-sm text-ink-soft">{INTROS[step]}</p>

      <div className="rounded-sm border border-rule bg-card p-4">
        {step === 'business' ? <BusinessForm profile={profile} /> : null}
        {step === 'goals' ? <GoalsForm settings={settings} /> : null}
        {step === 'categories' ? <CategoriesForm settings={settings} /> : null}
        {step === 'catalog' ? <CatalogForm catalog={catalog} /> : null}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          {stepIndex > 0 ? (
            <Button type="button" variant="ghost" onClick={() => setStepIndex((i) => i - 1)}>
              {bg.common.back}
            </Button>
          ) : null}
          {stepIndex < STEPS.length - 1 ? (
            <Button type="button" onClick={() => setStepIndex((i) => i + 1)}>
              {bg.common.next}
            </Button>
          ) : (
            <Button type="button" variant="ledger" onClick={finish} disabled={busy}>
              {bg.onboarding.finishCta}
            </Button>
          )}
        </div>
        <Button type="button" variant="ghost" onClick={finish} disabled={busy}>
          {bg.common.skip}
        </Button>
      </div>
    </div>
  );
}
