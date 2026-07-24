import { PricingCalculators } from '@/components/pricing/calculators';
import { getSettingsRow } from '@/lib/db/queries';
import { bg } from '@/lib/i18n/bg';

export default async function PricingPage() {
  const settingsRow = await getSettingsRow();
  const minMargin = Number(settingsRow?.min_margin ?? 0.3);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-xl font-medium">{bg.pricing.title}</h1>
        <p className="mt-1 text-sm text-ink-soft">{bg.pricing.minMarginNote(minMargin)}</p>
      </div>
      <PricingCalculators minMargin={minMargin} />
    </div>
  );
}
