'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  buildAiExport,
  type AiExportContext,
  type AiExportType,
} from '@/lib/ai-export/build';
import { fmtMonth } from '@/lib/format';
import { bg } from '@/lib/i18n/bg';

const TYPES: AiExportType[] = [
  'monthly',
  'yearly',
  'expenses',
  'pricing',
  'health',
  'plan30',
  'offer',
];

export function AiExportPanel({ ctx }: { ctx: AiExportContext }) {
  const [index, setIndex] = useState(ctx.derived.length - 1);
  const [type, setType] = useState<AiExportType>('monthly');
  const [copied, setCopied] = useState(false);

  const text = useMemo(
    () => buildAiExport(type, { ...ctx, index }),
    [ctx, index, type],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Клипбордът е блокиран — потребителят копира ръчно от кутията.
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="ai-month" className="text-sm font-medium">
            {bg.months.pick}
          </label>
          <select
            id="ai-month"
            value={index}
            onChange={(e) => setIndex(Number(e.target.value))}
            className="min-h-11 rounded-sm border border-rule bg-card px-2 py-1 text-sm"
          >
            {ctx.derived.map((d, i) => (
              <option key={`${d.year}-${d.month}`} value={i}>
                {fmtMonth(d.year, d.month)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="ai-type" className="text-sm font-medium">
            {bg.aiExport.pickType}
          </label>
          <select
            id="ai-type"
            value={type}
            onChange={(e) => setType(e.target.value as AiExportType)}
            className="min-h-11 rounded-sm border border-rule bg-card px-2 py-1 text-sm"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {bg.aiExport.types[t]}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" variant="ledger" onClick={copy}>
          {copied ? bg.common.copied : bg.common.copy}
        </Button>
      </div>

      <p className="text-sm text-ink-soft">{bg.aiExport.manualCopyHint}</p>

      <textarea
        readOnly
        value={text}
        rows={24}
        onFocus={(e) => e.target.select()}
        className="num w-full rounded-sm border border-rule bg-card p-3 text-xs leading-relaxed"
        aria-label={bg.aiExport.title}
      />
    </div>
  );
}
