import { SettingsTabs } from '@/components/settings/settings-tabs';
import { getProfile, getSettingsRow, listCatalog } from '@/lib/db/queries';
import { bg } from '@/lib/i18n/bg';

export default async function SettingsPage() {
  const [profile, settings, catalog] = await Promise.all([
    getProfile(),
    getSettingsRow(),
    listCatalog(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-medium">{bg.settings.title}</h1>
      <SettingsTabs profile={profile} settings={settings} catalog={catalog} />
    </div>
  );
}
