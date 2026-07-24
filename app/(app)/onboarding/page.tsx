import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';
import { getProfile, getSettingsRow, listCatalog } from '@/lib/db/queries';
import { bg } from '@/lib/i18n/bg';

export default async function OnboardingPage() {
  const [profile, settings, catalog] = await Promise.all([
    getProfile(),
    getSettingsRow(),
    listCatalog(),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="font-display text-xl font-medium">{bg.onboarding.title}</h1>
        <p className="mt-1 text-sm text-ink-soft">{bg.onboarding.skipHint}</p>
      </div>
      <OnboardingWizard profile={profile} settings={settings} catalog={catalog} />
    </div>
  );
}
