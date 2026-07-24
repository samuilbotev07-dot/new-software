import Link from 'next/link';
import { AiExportPanel } from '@/components/ai-export/ai-export-panel';
import { monthRowToInput } from '@/lib/db/mappers';
import { listMonthRows, loadAppContext } from '@/lib/db/queries';
import { bg } from '@/lib/i18n/bg';

export default async function AiExportPage() {
  const [ctx, monthRows] = await Promise.all([loadAppContext(), listMonthRows()]);

  if (ctx.derived.length === 0) {
    return (
      <div className="py-16 text-center text-ink-soft">
        <p>{bg.aiExport.noMonth}</p>
        <Link href="/month" className="mt-2 inline-block underline">
          {bg.dashboard.emptyCta}
        </Link>
      </div>
    );
  }

  const inputs = monthRows.map((r) => monthRowToInput(r, ctx.profile));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-xl font-medium">{bg.aiExport.title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">{bg.aiExport.intro}</p>
      </div>
      <AiExportPanel
        ctx={{
          profile: ctx.profile,
          settingsRow: ctx.settingsRow,
          settings: ctx.settings,
          inputs,
          derived: ctx.derived,
          index: ctx.derived.length - 1,
        }}
      />
    </div>
  );
}
